package cloud.eppo.relay;

import cloud.eppo.EppoClient;
import cloud.eppo.api.Attributes;

import cloud.eppo.api.BanditActions;
import cloud.eppo.api.ContextAttributes;
import cloud.eppo.api.BanditResult;
import cloud.eppo.api.EppoValue;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import static spark.Spark.*;

public class RelayServer {
    private static final Gson gson = new Gson();
    private static final Gson gsonWithNulls = new com.google.gson.GsonBuilder().serializeNulls().create();
    private static EppoClient eppoClient;

    public static void main(String[] args) {
        String host = System.getenv().getOrDefault("SDK_RELAY_HOST", "localhost");
        int portNum = Integer.parseInt(System.getenv().getOrDefault("SDK_RELAY_PORT", "4000"));
        String apiKey = System.getenv().getOrDefault("EPPO_API_KEY", "test-api-key");
        String baseUrl = System.getenv().getOrDefault("EPPO_BASE_URL", "http://localhost:5000/api");

        // Set Spark host and port
        ipAddress(host);
        port(portNum);

        // Initialize Eppo client
        initializeEppoClient(apiKey, baseUrl);

        // Health check endpoint
        get("/", (req, res) -> {
            res.type("application/json");
            return "{\"status\":\"ok\"}";
        });

        // SDK details endpoint
        get("/sdk/details", (req, res) -> {
            res.type("application/json");
            JsonObject response = new JsonObject();
            response.addProperty("sdkName", "java-server-sdk");
            response.addProperty("sdkVersion", "5.4.0-SNAPSHOT"); // Must match build.gradle dependency version
            response.addProperty("supportsBandits", true);
            response.addProperty("supportsDynamicTyping", false);
            return gson.toJson(response);
        });

        // Assignment endpoint
        post("/flags/v1/assignment", (req, res) -> {
            res.type("application/json");
            try {
                AssignmentRequest assignmentReq = gson.fromJson(req.body(), AssignmentRequest.class);

                Attributes attributes = parseAttributes(assignmentReq.subjectAttributes);

                Object result = getAssignment(assignmentReq, attributes);

                JsonObject response = new JsonObject();
                response.add("result", gson.toJsonTree(result));
                return gson.toJson(response);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                JsonObject error = new JsonObject();
                error.addProperty("error", e.getMessage());
                return gson.toJson(error);
            }
        });

        // Bandit action endpoint
        post("/bandits/v1/action", (req, res) -> {
            res.type("application/json");
            try {
                BanditRequest banditReq = gson.fromJson(req.body(), BanditRequest.class);

                // Parse subject attributes — preserve the explicit numeric/categorical
                // separation from the test data. Values that are mistyped (e.g. a string
                // in numericAttributes) are still placed in their declared section so the
                // SDK handles the type coercion, not the relay.
                Attributes subjectNumeric = new Attributes();
                Attributes subjectCategorical = new Attributes();
                if (banditReq.subjectAttributes != null) {
                    if (banditReq.subjectAttributes.numericAttributes != null) {
                        putAllAttributes(subjectNumeric, banditReq.subjectAttributes.numericAttributes);
                    }
                    if (banditReq.subjectAttributes.categoricalAttributes != null) {
                        putAllAttributes(subjectCategorical, banditReq.subjectAttributes.categoricalAttributes);
                    }
                }
                ContextAttributes subjectAttrs = new ContextAttributes(subjectNumeric, subjectCategorical);

                // Parse actions (sent as array of {actionKey, numericAttributes, categoricalAttributes})
                BanditActions actions = new BanditActions();
                if (banditReq.actions != null) {
                    for (ActionEntry actionEntry : banditReq.actions) {
                        Attributes actionNumeric = new Attributes();
                        Attributes actionCategorical = new Attributes();
                        if (actionEntry.numericAttributes != null) {
                            putAllAttributes(actionNumeric, actionEntry.numericAttributes);
                        }
                        if (actionEntry.categoricalAttributes != null) {
                            putAllAttributes(actionCategorical, actionEntry.categoricalAttributes);
                        }
                        actions.put(actionEntry.actionKey, new ContextAttributes(actionNumeric, actionCategorical));
                    }
                }

                // Call getBanditAction
                BanditResult banditResult = eppoClient.getBanditAction(
                    banditReq.flag,
                    banditReq.subjectKey,
                    subjectAttrs,
                    actions,
                    banditReq.defaultValue
                );

                // Use a simple POJO so gsonWithNulls serializes action:null
                Map<String, Object> resultObj = new HashMap<>();
                resultObj.put("variation", banditResult.getVariation());
                resultObj.put("action", banditResult.getAction());

                Map<String, Object> response = new HashMap<>();
                response.put("result", resultObj);
                return gsonWithNulls.toJson(response);
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                JsonObject error = new JsonObject();
                error.addProperty("error", e.getMessage());
                return gson.toJson(error);
            }
        });

        // Reset SDK endpoint
        post("/sdk/reset", (req, res) -> {
            res.type("application/json");
            try {
                initializeEppoClient(apiKey, baseUrl);
                return "{}";
            } catch (Exception e) {
                e.printStackTrace();
                res.status(500);
                JsonObject error = new JsonObject();
                error.addProperty("error", e.getMessage());
                return gson.toJson(error);
            }
        });

        System.out.println("Eppo Java Server SDK Relay listening on " + host + ":" + portNum);
    }

    private static void initializeEppoClient(String apiKey, String baseUrl) {
        eppoClient = EppoClient.builder(apiKey)
            .forceReinitialize(true)
            .apiBaseUrl(baseUrl)
            .isGracefulMode(false)
            .buildAndInit();
    }

    private static Attributes parseAttributes(Map<String, Object> attributesMap) {
        Attributes attributes = new Attributes();
        if (attributesMap != null) {
            putAllAttributes(attributes, attributesMap);
        }
        return attributes;
    }

    private static void putAllAttributes(Attributes target, Map<String, Object> source) {
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Number) {
                target.put(entry.getKey(), EppoValue.valueOf(((Number) value).doubleValue()));
            } else if (value instanceof Boolean) {
                target.put(entry.getKey(), EppoValue.valueOf((Boolean) value));
            } else if (value instanceof String) {
                target.put(entry.getKey(), EppoValue.valueOf((String) value));
            }
            // null and other types are silently skipped
        }
    }

    private static Object getAssignment(AssignmentRequest request, Attributes attributes) {
        switch (request.assignmentType) {
            case "STRING":
                return eppoClient.getStringAssignment(
                    request.flag,
                    request.subjectKey,
                    attributes,
                    (String) request.defaultValue
                );
            case "INTEGER":
                int defaultInt = request.defaultValue instanceof Number
                    ? ((Number) request.defaultValue).intValue()
                    : Integer.parseInt(request.defaultValue.toString());
                return eppoClient.getIntegerAssignment(
                    request.flag,
                    request.subjectKey,
                    attributes,
                    defaultInt
                );
            case "BOOLEAN":
                boolean defaultBool = request.defaultValue instanceof Boolean
                    ? (Boolean) request.defaultValue
                    : Boolean.parseBoolean(request.defaultValue.toString());
                return eppoClient.getBooleanAssignment(
                    request.flag,
                    request.subjectKey,
                    attributes,
                    defaultBool
                );
            case "NUMERIC":
                double defaultNumeric = request.defaultValue instanceof Number
                    ? ((Number) request.defaultValue).doubleValue()
                    : Double.parseDouble(request.defaultValue.toString());
                return eppoClient.getDoubleAssignment(
                    request.flag,
                    request.subjectKey,
                    attributes,
                    defaultNumeric
                );
            case "JSON":
                // Parse default value as JSONObject
                JSONObject defaultJson;
                if (request.defaultValue instanceof Map) {
                    defaultJson = new JSONObject((Map<?, ?>) request.defaultValue);
                } else if (request.defaultValue instanceof String) {
                    defaultJson = new JSONObject((String) request.defaultValue);
                } else {
                    defaultJson = new JSONObject(gson.toJson(request.defaultValue));
                }
                String jsonString = eppoClient.getJSONStringAssignment(
                    request.flag,
                    request.subjectKey,
                    attributes,
                    defaultJson.toString()
                );
                // Parse back to a map so Gson serializes it as an object, not a string
                return gson.fromJson(jsonString, Object.class);
            default:
                throw new IllegalArgumentException("Unknown assignment type: " + request.assignmentType);
        }
    }

    // Request DTOs
    static class AssignmentRequest {
        String flag;
        String assignmentType;
        Object defaultValue;
        String subjectKey;
        Map<String, Object> subjectAttributes;
    }

    static class BanditRequest {
        String flag;
        String defaultValue;
        String subjectKey;
        BanditSubjectAttributes subjectAttributes;
        ActionEntry[] actions;
    }

    static class BanditSubjectAttributes {
        Map<String, Object> numericAttributes;
        Map<String, Object> categoricalAttributes;
    }

    static class ActionEntry {
        String actionKey;
        Map<String, Object> numericAttributes;
        Map<String, Object> categoricalAttributes;
    }
}
