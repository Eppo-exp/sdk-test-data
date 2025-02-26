import 'package:logging/logging.dart';
import 'package:eppo_sdk/eppo_sdk.dart';
import 'relay_logger.dart';

class AssignmentHandler {
  final _logger = Logger('AssignmentHandler');
  final EppoClient eppoClient;
  final RelayLogger relayLogger;
  
  // Map of assignment types to method names
  static const Map<String, String> _methods = {
    'INTEGER': 'getIntegerAssignment',
    'STRING': 'getStringAssignment',
    'BOOLEAN': 'getBooleanAssignment',
    'NUMERIC': 'getNumericAssignment',
    'JSON': 'getJSONAssignment',
  };

  AssignmentHandler(this.eppoClient, this.relayLogger);

  Future<Map<String, dynamic>> getAssignment(Map<String, dynamic> payload) async {
    final variationType = payload['assignmentType'] as String;
    final flagKey = payload['flag'] as String;
    final defaultValue = payload['defaultValue'];
    final subjectKey = payload['subjectKey'] as String;
    final subjectAttributes = payload['subjectAttributes'] as Map<String, dynamic>?;

    _logger.info('Processing assignment for flag: $flagKey, subject: $subjectKey, type: $variationType');
    
    try {
      // Create a Subject with attributes
      final subject = Subject(subjectKey);
      
      // Add attributes if they exist
      if (subjectAttributes != null) {
        _addAttributes(subject, subjectAttributes);
      }
      
      // Get assignment based on variation type
      dynamic result;
      switch (variationType) {
        case 'STRING':
          result = eppoClient.stringAssignment(flagKey, subject, defaultValue as String? ?? '');
          break;
        case 'INTEGER':
          result = eppoClient.integerAssignment(flagKey, subject, defaultValue as int? ?? 0);
          break;
        case 'BOOLEAN':
          result = eppoClient.booleanAssignment(flagKey, subject, defaultValue as bool? ?? false);
          break;
        case 'NUMERIC':
          result = eppoClient.numericAssignment(flagKey, subject, defaultValue as double? ?? 0.0);
          break;
        case 'JSON':
          result = eppoClient.jsonAssignment(flagKey, subject, defaultValue as Map<String, dynamic>? ?? {});
          break;
        default:
          throw Exception('Invalid variation type $variationType');
      }
      
      return {
        'subjectKey': subjectKey,
        'result': result,
        'request': payload,
        'assignmentLog': relayLogger.assignmentLogs,
      };
    } catch (e) {
      _logger.severe('Error getting assignment: $e');
      return {
        'subjectKey': subjectKey,
        'result': defaultValue,
        'error': e.toString(),
        'assignmentLog': relayLogger.assignmentLogs,
      };
    } finally {
      relayLogger.resetLogs();
    }
  }
  
  // Helper method to add attributes to a subject
  void _addAttributes(Subject subject, Map<String, dynamic> attributes) {
    for (final entry in attributes.entries) {
      final key = entry.key;
      final value = entry.value;
      
      if (value is String) {
        subject.stringAttribute(key, value);
      } else if (value is int || value is double) {
        subject.numberAttribute(key, value);
      } else if (value is bool) {
        subject.boolAttribute(key, value);
      }
    }
  }
} 