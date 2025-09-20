import 'package:flutter/material.dart';

class SecurityScreen extends StatelessWidget {
  const SecurityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security'), backgroundColor: const Color(0xFF0D47A1)),
      body: ListView(
        children: [
          SwitchListTile(
            value: false,
            onChanged: (_) {},
            title: const Text('Enable biometrics (stub)'),
          ),
          ListTile(
            title: const Text('Logout everywhere'),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All sessions invalidated (stub)')),
              );
            },
          ),
          ListTile(
            title: const Text('Suspicious login alerts'),
            subtitle: const Text('You will be notified when a new device logs in.'),
            onTap: () {},
          )
        ],
      ),
    );
  }
}

