import 'dart:convert';
import 'dart:io';
import 'dart:ffi';

import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';
import 'package:shelf_router/shelf_router.dart';
import 'package:dotenv/dotenv.dart';
import 'package:logging/logging.dart';
import 'package:eppo_sdk/eppo_sdk.dart';
import 'package:path/path.dart' as path;

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

  // Set up the native library path
  try {
    // Get the directory where the executable is running
    final scriptDir = path.dirname(Platform.script.toFilePath());
    final workingDir = Directory.current.path;

    // Try to find the native library in various locations
    final possiblePaths = [
      path.join(workingDir, 'lib', 'native', 'libeppo_client.dylib'),
      path.join(scriptDir, '..', 'lib', 'native', 'libeppo_client.dylib'),
      path.join(workingDir, 'native', 'libeppo_client.dylib'),
    ];

    String? libraryPath;
    for (final p in possiblePaths) {
      if (File(p).existsSync()) {
        libraryPath = p;
        _logger.info('Found native library at: $libraryPath');
        break;
      }
    }

    if (libraryPath != null) {
      // Set the environment variable for the native library
      _logger.info('Setting RUST_LIBRARY_PATH to: $libraryPath');
      Platform.environment['RUST_LIBRARY_PATH'] = libraryPath;
    } else {
      _logger.severe(
          'Could not find native library in any of the expected locations');
    }
  } catch (e) {
    _logger.severe('Error setting up native library path: $e');
  }

  // Initialize the Eppo client
  final relayLogger = RelayLogger();
  EppoClient eppoClient =
      await initEppoClient(config.apiKey, config.apiServer, relayLogger);

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
      'sdkVersion':
          '1.0.0', // This should be dynamically determined if possible
      'supportsBandits': true,
      'supportsDynamicTyping': true,
    };
    return Response.ok(jsonEncode(details),
        headers: {'Content-Type': 'application/json'});
  });

  app.post('/sdk/reset', (Request request) async {
    // Reset the Eppo client (clear caches)
    await resetEppoClient();
    return Response.ok('Reset complete');
  });

  app.post('/flags/v1/assignment', (Request request) async {
    final payload =
        await request.readAsString().then(jsonDecode) as Map<String, dynamic>;
    final result = await assignmentHandler.getAssignment(payload);
    return Response.ok(jsonEncode(result),
        headers: {'Content-Type': 'application/json'});
  });

  app.post('/bandits/v1/action', (Request request) async {
    final payload =
        await request.readAsString().then(jsonDecode) as Map<String, dynamic>;
    final result = await banditHandler.getBanditAction(payload);
    return Response.ok(jsonEncode(result),
        headers: {'Content-Type': 'application/json'});
  });

  // Create a handler from the router
  final handler = Pipeline().addMiddleware(logRequests()).addHandler(app);

  // Get host and port from environment
  final host = env['SDK_RELAY_HOST'] ?? 'localhost';
  final port = int.parse(env['SDK_RELAY_PORT'] ?? '7001');

  // Start the server
  _logger.info('Starting server on $host:$port');
  final server = await serve(handler, '0.0.0.0', port);
  _logger.info('Server listening on ${server.address.host}:${server.port}');
}

// Update the initEppoClient function
Future<EppoClient> initEppoClient(
    String apiKey, String apiServer, RelayLogger logger) async {
  _logger.info('Initializing Eppo client with API server: $apiServer');

  // Create a custom assignment logger that forwards to our RelayLogger
  final assignmentLogger = _EppoRelayLogger(logger);

  // Create the Eppo client
  final client = EppoClient(
    sdkKey: apiKey,
    baseUrl: Uri.parse(apiServer),
    logger: assignmentLogger,
  );

  // Wait for the client to be ready
  await client.whenReady();

  return client;
}

// Add this class to bridge between Eppo's logger and our RelayLogger
class _EppoRelayLogger extends AssignmentLogger {
  final RelayLogger relayLogger;

  _EppoRelayLogger(this.relayLogger);

  @override
  void logAssignment(Map<String, dynamic> event) {
    relayLogger.logAssignment(event);
  }

  @override
  void logBanditAction(Map<String, dynamic> event) {
    relayLogger.logBanditAction(event);
  }
}

// Update the resetEppoClient function
Future<void> resetEppoClient() async {
  // This would need to be implemented based on the Eppo SDK
  // If the SDK has a reset method, call it here
  _logger.info('Resetting Eppo client');
}
