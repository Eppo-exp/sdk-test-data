from flask import Flask, request, jsonify
from os import environ
import time
from dataclasses import dataclass
from datetime import datetime
import logging

import eppo_client
from eppo_client.config import Config, AssignmentLogger


app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class LocalAssignmentLogger(AssignmentLogger):
    def log_assignment(self, assignment):
        logger.info(f"Assignment: {assignment}")


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
    logger.info(f"Request data: {data}")
    print(f"Request data: {data}")
    
    request_obj = AssignmentRequest(
        flag=data['flag'],
        subject_key=data['subjectKey'],
        subject_attributes=data['subjectAttributes'],
        assignment_type=data['assignmentType'],
        default_value=data['defaultValue']
    )
    
    client = eppo_client.get_instance()
    assignment_type = data['assignmentType']
    logger.info(f"Processing {assignment_type} assignment for flag '{request_obj.flag}'")
    
    try:
        match assignment_type:
            case 'BOOLEAN':
                result = client.get_boolean_assignment(
                    request_obj.flag, 
                    request_obj.subject_key, 
                    request_obj.subject_attributes, 
                    request_obj.default_value
                )
            case 'INTEGER':
                result = client.get_integer_assignment(
                    request_obj.flag, 
                    request_obj.subject_key, 
                    request_obj.subject_attributes, 
                    request_obj.default_value
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
                    request_obj.default_value
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
        logger.info(f"Assignment completed. Result: {result}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error processing assignment: {str(e)}", exc_info=True)
        raise

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
    logger.info("Initializing client")
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
    logger.info("Client initialized")

if __name__ == "__main__":
    initialize_client_and_wait()
    
    port = int(environ.get('SDK_RELAY_PORT', 7001))
    host = environ.get('SDK_RELAY_HOST', '0.0.0.0')
    logger.info(f"Starting server %% on {host}:{port}")
    print(f"Starting server!! on {host}:{port}")
    app.run(
        host=host,
        port=port,
        debug=True  # Add debug mode
    )
