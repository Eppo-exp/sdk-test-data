import eppo_client
import eppo_client.bandit

from flask import Flask, request, jsonify
from os import environ
from dataclasses import dataclass
from eppo_client.config import Config, AssignmentLogger

app = Flask(__name__)


class LocalAssignmentLogger(AssignmentLogger):
    def log_assignment(self, assignment):
        print(f"Assignment: {assignment}")


@dataclass
class AssignmentRequest:
    flag: str
    subject_key: str
    subject_attributes: dict
    assignment_type: str
    default_value: any


@app.route('/', methods=['GET'])
def health_check():
    return "OK"

@app.route('/sdk/reset', methods=['POST'])
def reset_sdk():
    initialize_client_and_wait()
    
    return "Reset complete"

@app.route('/sdk/details', methods=['GET'])
def get_sdk_details():
    return jsonify({
        "sdkName": "python-sdk", 
        "sdkVersion": "4.1.0",
        "supportsBandits": True,
        "supportsDynamicTyping": False
    })

@app.route('/flags/v1/assignment', methods=['POST'])
def handle_assignment():
    data = request.json
    request_obj = AssignmentRequest(
        flag=data['flag'],
        subject_key=data['subjectKey'],
        subject_attributes=data['subjectAttributes'],
        assignment_type=data['assignmentType'],
        default_value=data['defaultValue']
    )
    print(f"Request object: {request_obj}")
    
    client = eppo_client.get_instance()
    
    try:
        match request_obj.assignment_type:
            case 'BOOLEAN':
                result = client.get_boolean_assignment(
                    request_obj.flag, 
                    request_obj.subject_key, 
                    request_obj.subject_attributes, 
                    bool(request_obj.default_value)
                )
            case 'INTEGER':
                result = client.get_integer_assignment(
                    request_obj.flag, 
                    request_obj.subject_key, 
                    request_obj.subject_attributes, 
                    int(request_obj.default_value)
                )
            case 'STRING':
                result = client.get_string_assignment(
                    request_obj.flag, 
                    request_obj.subject_key, 
                    request_obj.subject_attributes, 
                    request_obj.default_value
                )
            case 'NUMERIC':
                result = client.get_numeric_assignment(
                    request_obj.flag, 
                    request_obj.subject_key, 
                    request_obj.subject_attributes, 
                    float(request_obj.default_value)
                )
            case 'JSON':
                result = client.get_json_assignment(
                    request_obj.flag, 
                    request_obj.subject_key, 
                    request_obj.subject_attributes, 
                    request_obj.default_value
                )
        
        response = {
            "result": result,
            "assignmentLog": [],
            "banditLog": [],
            "error": None
        }
        print(f"response: {response}")
        return jsonify(response)
    except Exception as e:
        print(f"Error processing assignment: {str(e)}")
        response = {
            "result": None,
            "assignmentLog": [],
            "banditLog": [],
            "error": str(e)
        }
        return jsonify(response)


@app.route('/bandits/v1/action', methods=['POST'])
def handle_bandit():
    data = request.json
    print(f"Request data: {data}")
    
    flag = data['flag']
    subject_key = data['subjectKey']
    subject_attributes = data['subjectAttributes']
    default_value = data['defaultValue']
    actions = data['actions']
    
    try:
        # Create subject context using ContextAttributes constructor
        subject_context = eppo_client.bandit.ContextAttributes(
            numeric_attributes=subject_attributes['numericAttributes'],
            categorical_attributes=subject_attributes['categoricalAttributes']
        )
        
        # Create actions dictionary using ContextAttributes constructor
        actions = {}
        for action in actions:
            action_key = action['actionKey']
            action_context = eppo_client.bandit.ContextAttributes(
                numeric_attributes=action['numericAttributes'],
                categorical_attributes=action['categoricalAttributes']
            )
            actions[action_key] = action_context
               
        print(f"\nExecuting bandit action:")
        print(f"Flag: {flag}")
        print(f"Subject: {subject_key}")
        print(f"Default: {default_value}")
        print(f"Available actions: {list(actions.keys())}")
        
        client = eppo_client.get_instance()
        result = client.get_bandit_action(
            flag,
            subject_key,
            subject_context,
            actions,
            default_value
        )
        print(f"Raw result from get_bandit_action: {result}")
        
        response = {
            "result": result,
            "assignmentLog": [],
            "banditLog": [],
            "error": None
        }
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing bandit: {str(e)}")
        response = {
            "result": None,
            "assignmentLog": [],
            "banditLog": [],
            "error": str(e)
        }
        return jsonify(response)

def initialize_client_and_wait():
    print("Initializing client")
    api_key = environ.get('EPPO_API_KEY', 'NOKEYSPECIFIED')
    base_url = environ.get('EPPO_BASE_URL', 'http://localhost:5000/api')
    
    # Add debug logging for initialization
    print(f"Initializing with API key: {api_key}, base URL: {base_url}")
    
    client_config = Config(
        api_key=api_key,
        base_url=base_url,
        assignment_logger=LocalAssignmentLogger()
    )
    eppo_client.init(client_config)
    client = eppo_client.get_instance()
    
    # Add debug logging for initialization status
    print("Waiting for initialization...")
    client.wait_for_initialization()
    print("Client initialization complete")
    
    # Try to fetch a configuration to verify it's working
    try:
        config = client.get_configuration()
        print(f"Test configuration: {config}")
    except Exception as e:
        print(f"Error fetching test configuration: {e}")

if __name__ == "__main__":
    initialize_client_and_wait()
    
    port = int(environ.get('SDK_RELAY_PORT', 7001))
    #host = environ.get('SDK_RELAY_HOST', '0.0.0.0')
    host = '0.0.0.0'
    print(f"Starting server on {host}:{port}")
    app.run(
        host=host,
        port=port,
        debug=True  # Add debug mode
    )
