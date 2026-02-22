class Message {
  final String id;
  final String type;
  final Map<String, dynamic> content;
  final int timestamp;
  final String? symbol;
  final String sender;
  final String botId;
  bool isActive;

  int? get signalTime => content['signalTime'] as int?;

  Message({
    required this.id,
    required this.type,
    required this.content,
    required this.timestamp,
    this.symbol,
    required this.sender,
    required this.botId,
    this.isActive = true,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      content: json['content'] is Map<String, dynamic>
          ? json['content']
          : {'description': json['content']?.toString()},
      timestamp: json['timestamp'] is int ? json['timestamp'] : int.tryParse(json['timestamp']?.toString() ?? '') ?? 0,
      symbol: json['symbol']?.toString(),
      sender: json['sender']?.toString() ?? 'Bot',
      botId: json['botId']?.toString() ?? '',
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
