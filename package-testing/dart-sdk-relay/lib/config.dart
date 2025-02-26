import 'dart:io';
import 'package:dotenv/dotenv.dart';

class Config {
  final String apiKey;
  final String apiServer;

  Config() : 
    apiKey = Platform.environment['EPPO_API_KEY'] ?? DotEnv()['EPPO_API_KEY'] ?? 'NOKEYSPECIFIED',
    apiServer = Platform.environment['EPPO_BASE_URL'] ?? DotEnv()['EPPO_BASE_URL'] ?? 'http://localhost:5000/api';
}