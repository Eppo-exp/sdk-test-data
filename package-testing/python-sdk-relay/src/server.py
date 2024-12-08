from flask import Flask, request, jsonify
from os import environ
import time
from dataclasses import dataclass

import eppo_client
from eppo_client.config import Config, AssignmentLogger


app = Flask(__name__)

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

@app.route('/flags/v1/assignment', methods=['POST'])
def handle_assignment():
    data = request.json
    request = AssignmentRequest(
        flag=data['flag'],
        subject_key=data['subjectKey'],
        subject_attributes=data['subjectAttributes'],
        assignment_type=data['assignmentType'],
        default_value=data['defaultValue']
    )
    print(data)
    print(request)
    
    client = eppo_client.get_instance()
    assignmentType = data['assignmentType']
    match assignmentType:
        case 'BOOLEAN':
            result = client.get_boolean_assignment(
                request.flag, 
                request.subject_key, 
                request.subject_attributes, 
                request.default_value
            )
        case 'INTEGER':
            result = client.get_integer_assignment(
                request.flag, 
                request.subject_key, 
                request.subject_attributes, 
                request.default_value
            )
        case 'STRING':
            result = client.get_string_assignment(
                request.flag, 
                request.subject_key, 
                request.subject_attributes, 
                request.default_value
            )
        case 'NUMERIC':
            result = client.get_numeric_assignment(
                request.flag, 
                request.subject_key, 
                request.subject_attributes, 
                request.default_value
            )
        case 'JSON':
            result = client.get_json_assignment(
                request.flag, 
                request.subject_key, 
                request.subject_attributes, 
                request.default_value
            )
    
    response = {
        "result": result,
        "assignmentLog": [],
        "banditLog": [],
        "error": None
    }
    return jsonify(response)

@app.route('/bandits/v1/action', methods=['POST'])
def handle_bandit():
    data = request.json
    # TODO: Implement actual bandit logic
    response = {
        "result": {
            "variation": "default_variation",
            "action": "default_action"
        },
        "assignmentLog": [],
        "banditLog": [],
        "error": None
    }
    return jsonify(response)

def initialize_client_and_wait():    
    api_key = environ.get('EPPO_API_KEY')
    if not api_key:
        raise ValueError("EPPO_API_KEY environment variable is required")
        
    client_config = Config(api_key=api_key)
    eppo_client.init(client_config)
    eppo_client.wait_for_initialization()
    
if __name__ == "__main__":
    initialize_client_and_wait()
    
    port = int(environ.get('SDK_RELAY_PORT', 7001))
    host = environ.get('SDK_RELAY_HOST', '0.0.0.0')
    print(f"Starting server on {host}:{port}")
    app.run(
        host=host,
        port=port,
        debug=True  # Add debug mode
    )
