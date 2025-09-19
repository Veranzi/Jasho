import 'package:flutter/material.dart';

class Transactions extends StatelessWidget {
  const Transactions({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Transaction History")),
      body: ListView(
        children: const [
          ListTile(title: Text("Payment from Client A"), subtitle: Text("KES 5000")),
          ListTile(title: Text("Payment to Supplier X"), subtitle: Text("KES 2000")),
        ],
      ),
    );
  }
}
