package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/Eppo-exp/golang-sdk/v6/eppoclient"
)

type AssignmentRequest struct {
	Flag              string                 `json:"flag"`
	SubjectKey        string                 `json:"subjectKey"`
	SubjectAttributes map[string]interface{} `json:"subjectAttributes"`
	AssignmentType    string                 `json:"assignmentType"`
	DefaultValue      interface{}            `json:"defaultValue"`
}

type AssignmentResponse struct {
	Result        interface{} `json:"result"`
	AssignmentLog []string    `json:"assignmentLog"`
	BanditLog     []string    `json:"banditLog"`
	Error         *string     `json:"error"`
}

type SDKDetails struct {
	SDKName               string `json:"sdkName"`
	SDKVersion            string `json:"sdkVersion"`
	SupportsBandits       bool   `json:"supportsBandits"`
	SupportsDynamicTyping bool   `json:"supportsDynamicTyping"`
}

var eppoClient = &eppoclient.EppoClient{}

func initializeClient() error {
	apiKey := os.Getenv("EPPO_API_KEY")
	if apiKey == "" {
		apiKey = "NOKEYSPECIFIED"
	}

	baseURL := os.Getenv("EPPO_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5000/api"
	}

	client, err := eppoclient.InitClient(eppoclient.Config{
		SdkKey:  apiKey,
		BaseUrl: baseURL,
	})
	if err != nil {
		return fmt.Errorf("failed to create client: %v", err)
	}

	eppoClient = client

	select {
	case <-client.Initialized():
	case <-time.After(3 * time.Second):
		log.Printf("Timed out waiting for Eppo SDK to initialize")
	}

	return nil
}

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "OK")
}

func handleSDKDetails(w http.ResponseWriter, r *http.Request) {
	details := SDKDetails{
		SDKName:               "go-sdk",
		SDKVersion:            "1.0.0",
		SupportsBandits:       false,
		SupportsDynamicTyping: false,
	}
	json.NewEncoder(w).Encode(details)
}

func handleReset(w http.ResponseWriter, r *http.Request) {
	err := initializeClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Fprint(w, "Reset complete")
}

func handleAssignment(w http.ResponseWriter, r *http.Request) {
	var req AssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var result interface{}
	var err error

	switch req.AssignmentType {
	case "BOOLEAN":
		defaultVal, _ := req.DefaultValue.(bool)
		result, err = eppoClient.GetBoolAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, defaultVal)

	case "STRING":
		defaultVal, _ := req.DefaultValue.(string)
		result, err = eppoClient.GetStringAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, defaultVal)

	case "NUMERIC":
		defaultVal, _ := strconv.ParseFloat(fmt.Sprintf("%v", req.DefaultValue), 64)
		result, err = eppoClient.GetNumericAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, defaultVal)

	case "INTEGER":
		defaultVal, _ := req.DefaultValue.(float64)
		result, err = eppoClient.GetIntegerAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, int64(defaultVal))

	case "JSON":
		result, err = eppoClient.GetJSONAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, req.DefaultValue)

	default:
		errMsg := fmt.Sprintf("unsupported assignment type: %s", req.AssignmentType)
		http.Error(w, errMsg, http.StatusBadRequest)
		return
	}

	response := AssignmentResponse{
		Result:        result,
		AssignmentLog: []string{},
		BanditLog:     []string{},
	}

	if err != nil {
		errStr := err.Error()
		response.Error = &errStr
		response.Result = nil
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleBanditAction(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement bandit logic
	response := AssignmentResponse{
		Result:        "action",
		AssignmentLog: []string{},
		BanditLog:     []string{},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	if err := initializeClient(); err != nil {
		log.Fatalf("Failed to initialize client: %v", err)
	}

	http.HandleFunc("/", handleHealthCheck)
	http.HandleFunc("/sdk/details", handleSDKDetails)
	http.HandleFunc("/sdk/reset", handleReset)
	http.HandleFunc("/flags/v1/assignment", handleAssignment)
	http.HandleFunc("/bandits/v1/action", handleBanditAction)

	port := os.Getenv("SDK_RELAY_PORT")
	if port == "" {
		port = "7001"
	}

	host := os.Getenv("SDK_RELAY_HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("Starting server on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
