require 'bundler/setup'
require 'sinatra'
require 'json'
require 'eppo_client'

class LocalAssignmentLogger < EppoClient::AssignmentLogger
  def log_assignment(assignment)
    puts "Assignment: #{assignment}"
  end
end

def initialize_client_and_wait
  puts "Initializing client"
  api_key = ENV['EPPO_API_KEY'] || 'NOKEYSPECIFIED'
  base_url = ENV['EPPO_BASE_URL'] || 'http://localhost:5000/api'
  
  client_config = EppoClient::Config.new(
    api_key,
    assignment_logger: LocalAssignmentLogger.new
  )
  
  EppoClient::init(client_config)
  client = EppoClient::Client.instance
  sleep(3)
  puts "Client initialized"
end

# Health check endpoint
get '/' do
  "OK"
end

# SDK reset endpoint
post '/sdk/reset' do
  initialize_client_and_wait
  "Reset complete"
end

# SDK details endpoint
get '/sdk/details' do
  content_type :json
  {
    sdkName: "ruby-sdk",
    sdkVersion: "3.3.0",
    supportsBandits: false,
    supportsDynamicTyping: false
  }.to_json
end

# Assignment endpoint
post '/flags/v1/assignment' do
  content_type :json
  data = JSON.parse(request.body.read)
  
  client = EppoClient::Client.instance
  
  begin
    result = case data['assignmentType']
    when 'BOOLEAN'
      client.get_boolean_assignment(
        data['flag'],
        data['subjectKey'],
        data['subjectAttributes'],
        data['defaultValue']
      )
    when 'INTEGER'
      client.get_integer_assignment(
        data['flag'],
        data['subjectKey'],
        data['subjectAttributes'],
        data['defaultValue'].to_i
      )
    when 'STRING'
      client.get_string_assignment(
        data['flag'],
        data['subjectKey'],
        data['subjectAttributes'],
        data['defaultValue']
      )
    when 'NUMERIC'
      client.get_numeric_assignment(
        data['flag'],
        data['subjectKey'],
        data['subjectAttributes'],
        data['defaultValue'].to_f
      )
    when 'JSON'
      client.get_json_assignment(
        data['flag'],
        data['subjectKey'],
        data['subjectAttributes'],
        data['defaultValue']
      )
    end
    
    {
      result: result,
      assignmentLog: [],
      banditLog: [],
      error: nil
    }.to_json
  rescue => e
    puts "Error processing assignment: #{e}"
    {
      result: nil,
      assignmentLog: [],
      banditLog: [],
      error: e.message
    }.to_json
  end
end

# Bandit endpoint
post '/bandits/v1/action' do
  content_type :json
  data = JSON.parse(request.body.read)
  
  # TODO: Implement bandit logic
  {
    result: "action",
    assignmentLog: [],
    banditLog: [],
    error: nil
  }.to_json
end

initialize_client_and_wait

host = ENV['SDK_RELAY_HOST'] || '0.0.0.0'
port = ENV['SDK_RELAY_PORT'] || 7001
set :port, port
set :bind, host
