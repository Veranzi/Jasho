import 'package:flutter/material.dart';

class HelpPage extends StatelessWidget {
  const HelpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Help & Support")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Text("FAQ:", style: TextStyle(fontWeight: FontWeight.bold)),
          SizedBox(height: 10),
          Text("1. How to reset password?\nGo to 'Forgot Password' on login page."),
          SizedBox(height: 10),
          Text("2. How to check earnings?\nGo to Dashboard > Earnings."),
        ],
      ),
    );
  }
}
