import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../signals/data/message_service.dart';

class AuthProvider with ChangeNotifier {
  final MessageService _messageService;
  String? _botId;
  bool _isInitialized = false;

  AuthProvider(this._messageService);

  String? get botId => _botId;
  bool get isInitialized => _isInitialized;

  Future<bool> checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _botId = prefs.getString('botId');
    if (_botId != null && _botId!.isNotEmpty) {
      _isInitialized = await _messageService.initialize(_botId!);
      notifyListeners();
      return _isInitialized;
    }
    return false;
  }

  Future<bool> login(String botId) async {
    _isInitialized = await _messageService.initialize(botId);
    if (_isInitialized) {
      _botId = botId;
      notifyListeners();
    }
    return _isInitialized;
  }
}
