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

@dataclass
class BanditActionRequest:
    flag: str
    subject_key: str
    subject_attributes: dict  # Will contain numericAttributes and categoricalAttributes
    actions: list            # List of dicts with actionKey, numericAttributes, categoricalAttributes
    default_value: any


@app.route('/bandits/v1/action', methods=['POST'])
def handle_bandit():
    data = request.json
    request_obj = BanditActionRequest(
        flag=data['flag'],
        subject_key=data['subjectKey'],
        subject_attributes=data['subjectAttributes'],
        default_value=data['defaultValue'],
        actions=data['actions']
    )
    print(f"Request object: {request_obj}")
    
    client = eppo_client.get_instance()
    
    try:
        # Convert actions to the format expected by the SDK
        actions = {}
        for action in request_obj.actions:
            actions[action['actionKey']] = eppo_client.bandit.AttributeSet(
                numeric_attributes=action.get('numericAttributes', {}),
                categorical_attributes=action.get('categoricalAttributes', {})
            )
        
        # Convert subject attributes
        subject_attributes = eppo_client.bandit.AttributeSet(
            numeric_attributes=request_obj.subject_attributes.get('numericAttributes', {}),
            categorical_attributes=request_obj.subject_attributes.get('categoricalAttributes', {})
        )
        
        result = client.get_bandit_action(
            request_obj.flag,
            request_obj.subject_key,
            subject_attributes,
            actions,
            request_obj.default_value
        )
        
        response = {
            "result": result,
            "assignmentLog": [],  # You might want to implement assignment logging
            "banditLog": [],      # You might want to implement bandit logging
            "error": None
        }
        print(f"response: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing bandit action: {str(e)}")
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
    
    client_config = Config(
        api_key=api_key,
        base_url=base_url,
        assignment_logger=LocalAssignmentLogger()
    )
    eppo_client.init(client_config)
    client = eppo_client.get_instance()
    client.wait_for_initialization()
    print("Client initialized")

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
