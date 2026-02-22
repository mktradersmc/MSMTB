import 'package:flutter/foundation.dart';
import '../data/message_model.dart' as model;
import '../data/message_service.dart';

class SignalsProvider with ChangeNotifier {
  final MessageService _messageService;
  List<model.Message> _signals = [];
  int _activeSignalsCount = 0;

  SignalsProvider(this._messageService) {
    _messageService.messagesStream.listen(_handleMessages);
  }

  List<model.Message> get signals => _signals;
  int get activeSignalsCount => _activeSignalsCount;

  void _handleMessages(List<model.Message> messages) {
    _signals = messages;
    _activeSignalsCount = messages.where((msg) =>
    msg.isActive &&
        msg.type == 'NewTradeSignal'
    ).length;
    notifyListeners();
  }

  Future<void> activateMacro(String strategy, String direction, String symbol) async {
    await _messageService.sendActivateMacro(strategy, direction, symbol);
  }

  Future<void> closeSignal(String messageId) async {
    await _messageService.updateMessageStatus(messageId, false);
  }

  Future<void> sendCommand(String command) async {
     await _messageService.sendMessage('Command', {'command': command});
  }
}
