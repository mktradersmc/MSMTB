import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primarySwatch: Colors.blue,
      visualDensity: VisualDensity.adaptivePlatformDensity,
      useMaterial3: true,
      // cardTheme removed to avoid type conflict in recent Flutter versions
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
    );
  }
}
