import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../../../core/constants/api_constants.dart';
import 'message_model.dart' as model;

class MessageService {
  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin;
  String _botId = '';

  final _messagesController = StreamController<List<model.Message>>.broadcast();
  Stream<List<model.Message>> get messagesStream => _messagesController.stream;

  List<model.Message> _currentMessages = [];
  int _lastSyncTimestamp = 0;
  Timer? _syncTimer;
  Timer? _statusCheckTimer;

  String get botId => _botId;

  MessageService({
    required FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin,
  }) : _flutterLocalNotificationsPlugin = flutterLocalNotificationsPlugin;

  Future<bool> initialize(String botId) async {
    print("Initializing MessageService with botId: $botId");
    _botId = botId;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('botId', botId);

    _lastSyncTimestamp = 0;
    _currentMessages.clear(); // Clear old messages on re-init

    try {
      await syncMessages();
      _startPeriodicSync();
      _startPeriodicStatusCheck();
      return true;
    } catch (e) {
      print("Error initializing MessageService: $e");
      return false;
    }
  }

  void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      syncMessages();
    });
  }

  void _startPeriodicStatusCheck() {
    _statusCheckTimer?.cancel();
    _statusCheckTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      _checkMessageStatus();
    });
  }

  Future<void> _checkMessageStatus() async {
    if (_botId.isEmpty) return;

    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/getMessages?botId=$_botId'),
        headers: {'Authorization': 'Bearer ${ApiConstants.apiKey}'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> serverMessages = data['messages'] ?? [];
        
        final serverMessageMap = {for (var m in serverMessages) m['id'].toString(): m};
        
        // Filter and update existing messages
        List<model.Message> updatedMessages = [];
        for (var message in _currentMessages) {
           final serverMessage = serverMessageMap[message.id];
           if (serverMessage != null) {
              message.isActive = serverMessage['isActive'] is bool
                ? serverMessage['isActive']
                : (serverMessage['isActive'] == 1 || serverMessage['isActive'] == "true");
              if (message.isActive) {
                 updatedMessages.add(message);
              }
           }
        }
        _currentMessages = updatedMessages;

        _messagesController.add(List.from(_currentMessages));
      }
    } catch (e) {
      print("Error checking message status: $e");
    }
  }

  Future<void> syncMessages() async {
    if (_botId.isEmpty) return;

    try {
      final Uri uri = Uri.parse('${ApiConstants.baseUrl}/getMessages?botId=$_botId&lastTimestamp=$_lastSyncTimestamp');

      final response = await http.get(
        uri,
        headers: {'Authorization': 'Bearer ${ApiConstants.apiKey}'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> newMessages = data['messages'] ?? [];

        bool updated = false;
        for (var messageData in newMessages) {
          final message = model.Message.fromJson(messageData);
          if (message.isActive && !_currentMessages.any((m) => m.id == message.id)) {
            _currentMessages.add(message);
            updated = true;
            await _showNotification(message);
          }
        }

        if (updated) {
          if (_currentMessages.isNotEmpty) {
            _lastSyncTimestamp = _currentMessages.map((m) => m.timestamp).reduce((a, b) => a > b ? a : b);
          }
          _currentMessages.sort((a, b) => b.timestamp.compareTo(a.timestamp));
          _messagesController.add(List.from(_currentMessages));
        }
      }
    } catch (e) {
      print("Error syncing messages: $e");
    }
  }

  Future<void> _showNotification(model.Message message) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
    AndroidNotificationDetails(
      'trade_signals',
      'Trade Signals',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
    );
    const NotificationDetails platformChannelSpecifics =
    NotificationDetails(android: androidPlatformChannelSpecifics);

    await _flutterLocalNotificationsPlugin.show(
      message.timestamp.hashCode, // Unique ID
      'New Message',
      message.content['description'] ?? '',
      platformChannelSpecifics,
      payload: message.id,
    );
  }

  Future<void> updateMessageStatus(String messageId, bool isActive) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/updateMessageStatus'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${ApiConstants.apiKey}',
        },
        body: json.encode({
          'messageId': messageId,
          'botId': _botId,
          'isActive': isActive,
        }),
      );

      if (response.statusCode == 200) {
        _currentMessages.removeWhere((message) => message.id == messageId);
        _messagesController.add(List.from(_currentMessages));
      }
    } catch (e) {
      print("Error updating message status: $e");
    }
  }

  Future<bool> sendMessage(String type, Map<String, dynamic> content, {String? symbol}) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/sendMessage'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${ApiConstants.apiKey}',
        },
        body: json.encode({
          'type': type,
          'content': content,
          'botId': _botId,
          'symbol': symbol,
          'sender': 'App',
          'sendPush': true,
        }),
      );

      if (response.statusCode == 200) {
        await syncMessages();
        return true;
      }
      return false;
    } catch (e) {
      print("Error sending message: $e");
      return false;
    }
  }

  Future<bool> sendActivateMacro(String strategy, String direction, String symbol) async {
    return sendMessage(
      'ActivateMacro',
      {
        'strategy': strategy,
        'direction': direction,
        'symbol': symbol,
      },
      symbol: symbol,
    );
  }

  void dispose() {
    _syncTimer?.cancel();
    _statusCheckTimer?.cancel();
    _messagesController.close();
  }
}
