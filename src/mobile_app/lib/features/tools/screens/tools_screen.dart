import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../signals/logic/signals_provider.dart';

class ToolsScreen extends StatelessWidget {
  const ToolsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      padding: EdgeInsets.all(16),
      children: [
        _buildTool(
          context,
          'Start',
          Icons.play_arrow,
          Colors.green,
              () => context.read<SignalsProvider>().sendCommand('EV_ACTIVATE_TRADING'),
        ),
        _buildTool(
          context,
          'Stop',
          Icons.stop,
          Colors.red,
              () => context.read<SignalsProvider>().sendCommand('EV_DEACTIVATE_TRADING'),
        ),
      ],
    );
  }

  Widget _buildTool(BuildContext context, String label, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            SizedBox(height: 8),
            Text(label, style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
