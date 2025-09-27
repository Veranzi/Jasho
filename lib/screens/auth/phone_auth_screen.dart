import 'package:flutter/material.dart';
import 'package:intl_phone_field/intl_phone_field.dart';

class PhoneAuthScreen extends StatefulWidget {
  const PhoneAuthScreen({super.key});

  @override
  State<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends State<PhoneAuthScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  bool _codeSent = false;
  String? _fullPhoneE164;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Phone Verification')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                IntlPhoneField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Phone Number'),
                  initialCountryCode: 'KE',
                  onChanged: (val) => _fullPhoneE164 = val.completeNumber,
                  validator: (val) {
                    if (val == null || val.number.isEmpty) return 'Enter phone number';
                    return null;
                  },
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
                      if (_fullPhoneE164 == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a valid phone number')),
                        );
                        return;
                      }
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
        ),
      ),
    );
  }
}

