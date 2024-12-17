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

var eppoClient *eppoclient.EppoClient

func initializeClient() error {
	apiKey := os.Getenv("EPPO_API_KEY")
	if apiKey == "" {
		apiKey = "NOKEYSPECIFIED"
	}

	baseURL := os.Getenv("EPPO_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5000/api"
	}

	// Create configuration
	config := eppoclient.Config{
		SdkKey:  apiKey,
		BaseUrl: baseURL,
	}

	// Initialize client
	client, err := eppoclient.InitClient(config)
	if err != nil {
		return fmt.Errorf("failed to create client: %v", err)
	}

	// Wait for initialization with timeout
	initChan := make(chan struct{})
	go func() {
		<-client.Initialized()
		close(initChan)
	}()

	select {
	case <-initChan:
		log.Printf("Eppo client initialized successfully")
	case <-time.After(5 * time.Second):
		log.Printf("Warning: Timed out waiting for Eppo SDK to initialize")
	}

	eppoClient = client
	return nil
}

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "OK")
}

func handleSDKDetails(w http.ResponseWriter, r *http.Request) {
	details := SDKDetails{
		SDKName:               "go-sdk",
		SDKVersion:            "6.1.0",
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

	// Always prepare a response with default values
	response := AssignmentResponse{
		Result:        req.DefaultValue,
		AssignmentLog: []string{},
		BanditLog:     []string{},
	}

	// Check if client is nil or not initialized
	if eppoClient == nil {
		errStr := "client not initialized"
		response.Error = &errStr
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	var err error
	defer func() {
		if r := recover(); r != nil {
			errStr := fmt.Sprintf("panic recovered: %v", r)
			response.Error = &errStr
			response.Result = req.DefaultValue
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
		}
	}()

	switch req.AssignmentType {
	case "BOOLEAN":
		defaultVal, _ := req.DefaultValue.(bool)
		response.Result, err = eppoClient.GetBoolAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, defaultVal)

	case "STRING":
		defaultVal, _ := req.DefaultValue.(string)
		response.Result, err = eppoClient.GetStringAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, defaultVal)

	case "NUMERIC":
		var defaultVal float64
		switch v := req.DefaultValue.(type) {
		case float64:
			defaultVal = v
		case int:
			defaultVal = float64(v)
		case string:
			defaultVal, _ = strconv.ParseFloat(v, 64)
		}
		response.Result, err = eppoClient.GetNumericAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, defaultVal)

	case "INTEGER":
		var defaultVal int64
		switch v := req.DefaultValue.(type) {
		case float64:
			defaultVal = int64(v)
		case int:
			defaultVal = int64(v)
		case string:
			val, _ := strconv.ParseInt(v, 10, 64)
			defaultVal = val
		}
		response.Result, err = eppoClient.GetIntegerAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, defaultVal)

	case "JSON":
		response.Result, err = eppoClient.GetJSONAssignment(req.Flag, req.SubjectKey, req.SubjectAttributes, req.DefaultValue)

	default:
		errStr := fmt.Sprintf("unsupported assignment type: %s", req.AssignmentType)
		response.Error = &errStr
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	if err != nil {
		errStr := err.Error()
		response.Error = &errStr
		response.Result = req.DefaultValue
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
