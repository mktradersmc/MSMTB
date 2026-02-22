import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../signals/data/message_model.dart';
import '../../../signals/logic/signals_provider.dart';

class SignalCard extends StatelessWidget {
  final Message message;

  const SignalCard({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildTag(message.type, Colors.blue),
                Text(
                  _formatDate(message.timestamp),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              message.content['description'] ?? 'No Description',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            SizedBox(height: 12),
            if (message.type == 'NewTradeSignal')
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    child: Text('Ignore'),
                    onPressed: () => context.read<SignalsProvider>().closeSignal(message.id),
                  ),
                  SizedBox(width: 8),
                  ElevatedButton(
                    child: Text('Activate'),
                    onPressed: () {
                      context.read<SignalsProvider>().activateMacro(
                        message.content['strategy'] ?? '',
                        message.content['direction'] ?? '',
                        message.symbol ?? '',
                      );
                      context.read<SignalsProvider>().closeSignal(message.id);
                    },
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }

  String _formatDate(int timestamp) {
    return DateFormat('HH:mm').format(DateTime.fromMillisecondsSinceEpoch(timestamp));
  }
}
