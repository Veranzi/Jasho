import 'package:flutter/material.dart';

class PhoneAuthScreen extends StatefulWidget {
  const PhoneAuthScreen({super.key});

  @override
  State<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends State<PhoneAuthScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  bool _codeSent = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Phone Verification')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone Number'),
            ),
            if (_codeSent) ...[
              const SizedBox(height: 10),
              TextField(
                controller: _codeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'SMS Code'),
              ),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                if (!_codeSent) {
                  setState(() => _codeSent = true);
                  ScaffoldMessenger.of(context)
                      .showSnackBar(const SnackBar(content: Text('Code sent')));
                } else {
                  Navigator.pop(context);
                }
              },
              child: Text(_codeSent ? 'Verify' : 'Send Code'),
            )
          ],
        ),
      ),
    );
  }
}

