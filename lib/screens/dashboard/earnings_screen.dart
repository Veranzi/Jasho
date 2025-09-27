import 'package:flutter/material.dart';

class MyEarningsPage extends StatelessWidget {
  const MyEarningsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("My Earnings")),
      body: const Center(
        child: Text("KES 10,000 earned this month", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
