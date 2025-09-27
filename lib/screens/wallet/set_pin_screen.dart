import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/pin_provider.dart';

class SetPinScreen extends StatefulWidget {
  const SetPinScreen({super.key});

  @override
  State<SetPinScreen> createState() => _SetPinScreenState();
}

class _SetPinScreenState extends State<SetPinScreen> {
  final _pinController = TextEditingController();
  final _confirmController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Transaction PIN')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _pinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Enter 4-digit PIN'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _confirmController,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Confirm PIN'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                if (_pinController.text.trim() != _confirmController.text.trim()) return;
                // trivial hash
                final hash = _pinController.text.trim();
                context.read<PinProvider>().setPinHash(hash);
                Navigator.pop(context);
              },
              child: const Text('Save PIN'),
            )
          ],
        ),
          ),
        ),
      ),
    );
  }
}

