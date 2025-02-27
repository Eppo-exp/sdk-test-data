import 'package:dart_client_sdk_relay/eppo.dart';
import 'package:flutter/material.dart';
import 'package:eppo_sdk/eppo_sdk.dart';

import 'package:http/http.dart' as http;
import 'dart:convert'; // for JSON encoding/decoding
import 'dart:math'; // Add this import at the top

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // TRY THIS: Try running your application with "flutter run". You'll see
        // the application has a purple toolbar. Then, without quitting the app,
        // try changing the seedColor in the colorScheme below to Colors.green
        // and then invoke "hot reload" (save your changes or press the "hot
        // reload" button in a Flutter-supported IDE, or press "r" if you used
        // the command line to start the app).
        //
        // Notice that the counter didn't reset back to zero; the application
        // state is not lost during the reload. To reset the state, use hot
        // restart instead.
        //
        // This works for code too, not just values: Most code changes can be
        // tested with just a hot reload.
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class StringAssignmentWidget extends StatefulWidget {
  final String flagKey;
  final String defaultValue;

  const StringAssignmentWidget({
    super.key,
    required this.flagKey,
    required this.defaultValue,
  });

  @override
  State<StatefulWidget> createState() => _StringAssignmentState();
}

class _StringAssignmentState extends State<StringAssignmentWidget> {
  String? _assignmentValue;

  _StringAssignmentState() {
    print('creating assignment widget 2');
    //await MyEppoProvider.eppoClient.whenReady();

    Future<http.Response> fetchAlbum() async {
      const url = 'https://jsonplaceholder.typicode.com/albums/1';
      print('fetching from: $url');
      final response = await http.get(Uri.parse(url));

      print('response: ${response.body}');
      return response;
    }

    print('fetching album');
    fetchAlbum();

    // Basic GET request
    Future<void> fetchExample() async {
      try {
        // Use the same simple approach as fetchAlbum
        final encodedKey = Uri.encodeComponent(globalSdkKey);
        final url =
            'https://fscdn.eppo.cloud/api/flag-config/v1/config?apiKey=$encodedKey';

        print('Fetching from: $url');

        // Remove the headers to match your working request
        final response = await http.get(Uri.parse(url));

        print('Response status: ${response.statusCode}');

        if (response.statusCode == 200) {
          // Parse the JSON response
          final data = jsonDecode(response.body);
          print(
              '${response.body.substring(0, min(100, response.body.length))}...');
        } else {
          print('Request failed with status: ${response.statusCode}');
          print('Response body: ${response.body}');
        }
      } catch (e) {
        print('Error type: ${e.runtimeType}');
        print('Error details: $e');
      }
    }

    print('fetching example');
    fetchExample();

    print('check if eppo client is ready');
    MyEppoProvider.eppoClient.whenReady().then((_) {
      print("Eppo client is ready");

      var assignment = MyEppoProvider.eppoClient.stringAssignment(
        widget.flagKey,
        MyEppoProvider.subject,
        widget.defaultValue,
      );
      setState(() {
        print('Setting the state');
        _assignmentValue = assignment;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [Text(widget.flagKey), Text(_assignmentValue ?? "---")],
    );
  }
}

class MyHomePage extends StatefulWidget {
  final String title;

  const MyHomePage({super.key, required this.title});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      // This call to setState tells the Flutter framework that something has
      // changed in this State, which causes it to rerun the build method below
      // so that the display can reflect the updated values. If we changed
      // _counter without calling setState(), then the build method would not be
      // called again, and so nothing would appear to happen.
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            StringAssignmentWidget(flagKey: 'diagnostics', defaultValue: 'OFF'),
            const Text('You have pushed the button this many times:'),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}
