import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../signals/logic/signals_provider.dart';
import '../../dashboard/screens/widgets/signal_card.dart';

class SignalsScreen extends StatelessWidget {
  const SignalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SignalsProvider>(
      builder: (context, provider, child) {
        final signals = provider.signals;
        if (signals.isEmpty) {
          return Center(child: Text('No signals active'));
        }

        return ListView.builder(
          itemCount: signals.length,
          padding: EdgeInsets.all(12),
          itemBuilder: (context, index) {
            return SignalCard(message: signals[index]);
          },
        );
      },
    );
  }
}
