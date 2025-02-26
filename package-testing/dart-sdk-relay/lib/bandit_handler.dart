import 'package:logging/logging.dart';
import 'package:eppo_sdk/eppo_sdk.dart';
import 'relay_logger.dart';

class BanditHandler {
  final _logger = Logger('BanditHandler');
  final EppoClient eppoClient;
  final RelayLogger relayLogger;

  BanditHandler(this.eppoClient, this.relayLogger);

  Future<Map<String, dynamic>> getBanditAction(Map<String, dynamic> payload) async {
    _logger.info('Processing Bandit action');
    _logger.fine('Payload: $payload');

    final flagKey = payload['flag'] as String;
    final defaultValue = payload['defaultValue'] as String?;
    final subjectKey = payload['subjectKey'] as String;
    
    // Create subject with attributes
    final subject = Subject(subjectKey);
    
    // Add subject attributes if they exist
    if (payload['subjectAttributes'] != null) {
      final numericAttrs = payload['subjectAttributes']['numericAttributes'] as Map<String, dynamic>?;
      final categoricalAttrs = payload['subjectAttributes']['categoricalAttributes'] as Map<String, dynamic>?;
      
      _addNumericAttributes(subject, numericAttrs);
      _addCategoricalAttributes(subject, categoricalAttrs);
    }
    
    // Process actions
    final actionsList = payload['actions'] as List<dynamic>;
    final actionAttributes = <String, Attributes>{};
    
    for (final actionItem in actionsList) {
      final action = actionItem as Map<String, dynamic>;
      final actionKey = action['actionKey'] as String;
      
      final attrs = Attributes();
      
      // Add numeric attributes
      final numericAttrs = action['numericAttributes'] as Map<String, dynamic>?;
      if (numericAttrs != null) {
        for (final entry in numericAttrs.entries) {
          attrs.numberAttribute(entry.key, entry.value);
        }
      }
      
      // Add categorical attributes
      final categoricalAttrs = action['categoricalAttributes'] as Map<String, dynamic>?;
      if (categoricalAttrs != null) {
        for (final entry in categoricalAttrs.entries) {
          if (entry.value is bool) {
            attrs.boolAttribute(entry.key, entry.value);
          } else {
            attrs.stringAttribute(entry.key, entry.value.toString());
          }
        }
      }
      
      actionAttributes[actionKey] = attrs;
    }
    
    _logger.info('Flag: $flagKey, Subject: $subjectKey, Actions: ${actionAttributes.keys.join(', ')}');
    
    try {
      // Call the real bandit action method
      final banditResult = eppoClient.banditAction(
        flagKey,
        subject,
        actionAttributes,
        defaultValue ?? '',
      );
      
      return {
        'subjectKey': subjectKey,
        'result': {
          'variation': banditResult.variation,
          'action': banditResult.action,
        },
        'request': payload,
        'assignmentLog': relayLogger.assignmentLogs,
        'banditLog': relayLogger.banditLogs,
      };
    } catch (e) {
      _logger.severe('Error getting bandit action: $e');
      return {
        'subjectKey': subjectKey,
        'result': {
          'variation': null,
          'action': defaultValue,
        },
        'error': e.toString(),
        'assignmentLog': relayLogger.assignmentLogs,
        'banditLog': relayLogger.banditLogs,
      };
    } finally {
      relayLogger.resetLogs();
    }
  }
  
  // Helper methods to add attributes to a subject
  void _addNumericAttributes(Subject subject, Map<String, dynamic>? attributes) {
    if (attributes == null) return;
    
    for (final entry in attributes.entries) {
      subject.numberAttribute(entry.key, entry.value);
    }
  }
  
  void _addCategoricalAttributes(Subject subject, Map<String, dynamic>? attributes) {
    if (attributes == null) return;
    
    for (final entry in attributes.entries) {
      if (entry.value is bool) {
        subject.boolAttribute(entry.key, entry.value);
      } else {
        subject.stringAttribute(entry.key, entry.value.toString());
      }
    }
  }
} 