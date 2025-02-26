import 'dart:convert';
import 'dart:io';

import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';
import 'package:shelf_router/shelf_router.dart';
import 'package:dotenv/dotenv.dart';
import 'package:logging/logging.dart';

import 'package:dart_sdk_relay/config.dart';
import 'package:dart_sdk_relay/assignment_handler.dart';
import 'package:dart_sdk_relay/bandit_handler.dart';
import 'package:dart_sdk_relay/relay_logger.dart';

// Configure a logger
final _logger = Logger('dart_sdk_relay');

void main(List<String> args) async {
  // Load environment variables
  var env = DotEnv(includePlatformEnvironment: true)..load();
  
  // Configure logging
  Logger.root.level = Level.INFO;
  Logger.root.onRecord.listen((record) {
    stdout.writeln('${record.level.name}: ${record.time}: ${record.message}');
  });

  // Initialize configuration
  final config = Config();
  _logger.info('Starting server with API server: ${config.apiServer}');
  
  // Initialize the Eppo client
  final relayLogger = RelayLogger();
  final eppoClient = await initEppoClient(config.apiKey, config.apiServer, relayLogger);
  
  // Create handlers
  final assignmentHandler = AssignmentHandler(eppoClient, relayLogger);
  final banditHandler = BanditHandler(eppoClient, relayLogger);

  // Create a router
  final app = Router();

  // Define routes
  app.get('/', (Request request) {
    return Response.ok('hello, world');
  });

  app.get('/sdk/details', (Request request) {
    final details = {
      'sdkName': 'eppo-dart-sdk',
      'sdkVersion': '1.0.0', // This should be dynamically determined if possible
      'supportsBandits': true,
      'supportsDynamicTyping': true,
    };
    return Response.ok(jsonEncode(details), headers: {'Content-Type': 'application/json'});
  });

  app.post('/sdk/reset', (Request request) async {
    // Reset the Eppo client (clear caches)
    await resetEppoClient();
    return Response.ok('Reset complete');
  });

  app.post('/flags/v1/assignment', (Request request) async {
    final payload = await request.readAsString().then(jsonDecode) as Map<String, dynamic>;
    final result = await assignmentHandler.getAssignment(payload);
    return Response.ok(jsonEncode(result), headers: {'Content-Type': 'application/json'});
  });

  app.post('/bandits/v1/action', (Request request) async {
    final payload = await request.readAsString().then(jsonDecode) as Map<String, dynamic>;
    final result = await banditHandler.getBanditAction(payload);
    return Response.ok(jsonEncode(result), headers: {'Content-Type': 'application/json'});
  });

  // Create a handler from the router
  final handler = Pipeline()
      .addMiddleware(logRequests())
      .addHandler(app);

  // Get host and port from environment
  final host = env['SDK_RELAY_HOST'] ?? 'localhost';
  final port = int.parse(env['SDK_RELAY_PORT'] ?? '7001');

  // Start the server
  _logger.info('Starting server on $host:$port');
  final server = await serve(handler, '0.0.0.0', port);
  _logger.info('Server listening on ${server.address.host}:${server.port}');
}

// These functions will need to be implemented based on the Eppo Dart SDK
Future<dynamic> initEppoClient(String apiKey, String apiServer, RelayLogger logger) async {
  // This is a placeholder - actual implementation will depend on the Eppo Dart SDK
  _logger.info('Initializing Eppo client with API server: $apiServer');
  return {}; // Return a mock client for now
}

Future<void> resetEppoClient() async {
  // This is a placeholder - actual implementation will depend on the Eppo Dart SDK
  _logger.info('Resetting Eppo client');
}