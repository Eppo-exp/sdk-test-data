import 'package:logging/logging.dart';

// This class will need to be updated based on the actual Eppo Dart SDK implementation
class RelayLogger {
  final _logger = Logger('RelayLogger');
  
  // Store assignment logs
  final List<Map<String, dynamic>> assignmentLogs = [];
  
  // Store bandit logs
  final List<Map<String, dynamic>> banditLogs = [];
  
  // Log an assignment event
  void logAssignment(Map<String, dynamic> assignmentEvent) {
    _logger.fine('Logging assignment: $assignmentEvent');
    assignmentLogs.add(assignmentEvent);
  }
  
  // Log a bandit action event
  void logBanditAction(Map<String, dynamic> banditActionEvent) {
    _logger.fine('Logging bandit action: $banditActionEvent');
    banditLogs.add(banditActionEvent);
  }
  
  // Reset all logs
  void resetLogs() {
    assignmentLogs.clear();
    banditLogs.clear();
  }
} 