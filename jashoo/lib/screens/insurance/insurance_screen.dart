import 'package:flutter/material.dart';

class InsuranceScreen extends StatelessWidget {
  const InsuranceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final covers = const [
      {'name': 'Personal Accident Cover', 'premium': 'KES 50/week'},
      {'name': 'Medical Micro-Insurance', 'premium': 'KES 100/week'},
      {'name': 'Income Protection', 'premium': 'KES 80/week'},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Insurance'), backgroundColor: const Color(0xFF0D47A1)),
      body: ListView.builder(
        itemCount: covers.length,
        itemBuilder: (_, i) => ListTile(
          leading: const Icon(Icons.health_and_safety),
          title: Text(covers[i]['name'] as String),
          subtitle: Text(covers[i]['premium'] as String),
          trailing: ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Applied (stub)')),
              );
            },
            child: const Text('Apply'),
          ),
        ),
      ),
    );
  }
}

