import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../signals/screens/signals_screen.dart';
import '../../charts/screens/charts_screen.dart';
import '../../tools/screens/tools_screen.dart';
import '../../signals/logic/signals_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    SignalsScreen(),
    ChartsScreen(),
    ToolsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Awesome Bot')),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: [
          BottomNavigationBarItem(
            icon: Stack(
              children: [
                Icon(Icons.notifications),
                Consumer<SignalsProvider>(
                  builder: (context, provider, _) {
                    return provider.activeSignalsCount > 0
                        ? Positioned(
                            right: 0,
                            top: 0,
                            child: Container(
                              padding: EdgeInsets.all(2),
                              decoration: BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                              constraints: BoxConstraints(minWidth: 8, minHeight: 8),
                            ),
                          )
                        : SizedBox.shrink();
                  },
                ),
              ],
            ),
            label: 'Signals',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.show_chart), label: 'Charts'),
          BottomNavigationBarItem(icon: Icon(Icons.build), label: 'Tools'),
        ],
      ),
    );
  }
}
