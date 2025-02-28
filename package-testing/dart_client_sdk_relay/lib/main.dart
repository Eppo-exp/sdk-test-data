import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:eppo_sdk/eppo_sdk.dart';
import 'dart:collection';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Eppo SDK Relay',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const TestClientScreen(),
    );
  }
}

class TestClientScreen extends StatefulWidget {
  const TestClientScreen({super.key});

  @override
  State<TestClientScreen> createState() => _TestClientScreenState();
}

class RelayAssignmentLogger implements AssignmentLogger {
  final Queue<Map<String, dynamic>> _assignmentQueue = Queue<Map<String, dynamic>>();

  void logAssignment(Map<String, dynamic> assignment) {
    _assignmentQueue.add(assignment);
  }

  List<Map<String, dynamic>> emptyAssignmentQueue() {
    final assignments = List<Map<String, dynamic>>.from(_assignmentQueue);
    _assignmentQueue.clear();
    return assignments;
  }

  bool get hasAssignments => _assignmentQueue.isNotEmpty;

  @override
  void logBanditAction(Map<String, dynamic> event) {
    // TODO: implement logBanditAction
  }
}

class _TestClientScreenState extends State<TestClientScreen> {
  static const String sdkKey = String.fromEnvironment('EPPO_API_KEY');
  static const String testRunnerHost = String.fromEnvironment('TEST_RUNNER_HOST', defaultValue: 'http://localhost');
  static const String testRunnerPort = String.fromEnvironment('TEST_RUNNER_PORT', defaultValue: '3000');
  static const String eppoBaseUrl = String.fromEnvironment('EPPO_BASE_URL', defaultValue: 'http://localhost:5000/api');

  static const AssignmentLogger logger = AssignmentLogger();

  late io.Socket socket;
  late EppoClient eppoClient;
  String status = 'Initializing...';
  String assignmentLog = '';

  @override
  void initState() {
    super.initState();
    initializeSocket();
    initializeEppoClient();
  }

  void initializeSocket() {
    socket = io.io('$testRunnerHost:$testRunnerPort', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.onConnect((_) {
      setState(() => status = 'Connected');
      sendReady();
    });

    socket.onDisconnect((_) {
      setState(() => status = 'Disconnected');
    });

    socket.on('/sdk/reset', (data) async {
      await initializeEppoClient();
      if (data is List && data.isNotEmpty && data.last is Function) {
        (data.last as Function)([true]);
      }
    });

    socket.on('/flags/v1/assignment', handleAssignment);

    socket.connect();
  }

  Future<void> initializeEppoClient() async {
    
    eppoClient = EppoClient(
      sdkKey: sdkKey,
      baseUrl: Uri.parse(eppoBaseUrl),
      logger: logger,
    );
    await eppoClient.whenReady();
  }

  void sendReady() {
    const readyPacket = {
      'sdkName': 'dart-client-sdk',
      'supportsBandits': false,
      'sdkType': 'client'
    };
    socket.emitWithAck('READY', [jsonEncode(readyPacket)], ack: (data) {
          print('ack from server $data');
        });
  }

  void handleAssignment(dynamic data) async {
    if (data is! List) return;
    
    final requestData = data[0];
    final ack = data.last as Function;

    try {
      final request = requestData;//jsonDecode(requestData);
      final subject = Subject(request['subjectKey']);

      request['subjectAttributes'].forEach((key, value) {
        if (value is String) {
          subject.stringAttribute(key, value);
        } else if (value is bool) {
          subject.boolAttribute(key, value);
        } else if (value is num) {
          subject.numberAttribute(key, value as double);
        }
      });
      
      
      final result = await getAssignmentFromClient(
        flag: request['flag'],
        subject: subject,
        assignmentType: request['assignmentType'],
        defaultValue: request['defaultValue'],
      );

      ack([{'result': result}]);
    } catch (e) {
      debugPrint('Error handling assignment: $e');
      ack([{'error': e.toString()}]);
    }
  }

  Future<dynamic> getAssignmentFromClient({
    required String flag,
    required Subject subject,
    required String assignmentType,
    required dynamic defaultValue,
  }) async {
    switch (assignmentType) {
      case 'STRING':
        return eppoClient.stringAssignment(
          flag, subject, defaultValue as String);
      case 'INTEGER':
        return eppoClient.integerAssignment(
            flag, subject, defaultValue as int);
      case 'NUMERIC':
        return eppoClient.numericAssignment(
            flag, subject, defaultValue as double);
      case 'BOOLEAN':
        return eppoClient.booleanAssignment(
          flag, subject, defaultValue as bool);
      case 'JSON':
        return eppoClient.jsonAssignment(
          flag, subject, defaultValue as Map<String, dynamic>);
      default:
        throw Exception('Unsupported assignment type: $assignmentType');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Eppo SDK Relay'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('Status: ', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(status, style: const TextStyle(fontStyle: FontStyle.italic)),
              ],
            ),
            const SizedBox(height: 16),
            const Text('Assignment Log:', style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 24,
            )),
            Expanded(
              child: SingleChildScrollView(
                child: Text(assignmentLog),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    socket.disconnect();
    socket.dispose();
    super.dispose();
  }
}
