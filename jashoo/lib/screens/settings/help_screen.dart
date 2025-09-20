import 'package:flutter/material.dart';

class HelpPage extends StatelessWidget {
  const HelpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Help & Support"), backgroundColor: const Color(0xFF0D47A1)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text("FAQ:", style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          const Text("1. How to reset password?\nGo to 'Forgot Password' on login page."),
          const SizedBox(height: 10),
          const Text("2. How to check earnings?\nGo to Dashboard > Earnings."),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/supportChat'),
            child: const Text('Chat with Support'),
          ),
        ],
      ),
    );
  }
}
