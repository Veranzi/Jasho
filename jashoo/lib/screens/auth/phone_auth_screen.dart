import 'package:flutter/material.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

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
  String? _verificationId;
  bool _loading = false;

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
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : () async {
                      if (!_codeSent) {
                        if (_fullPhoneE164 == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please enter a valid phone number')),
                          );
                          return;
                        }
                        setState(() => _loading = true);
                        await FirebaseAuth.instance.verifyPhoneNumber(
                          phoneNumber: _fullPhoneE164!,
                          verificationCompleted: (credential) async {
                            // Auto-resolve on Android
                          },
                          verificationFailed: (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Verification failed: ${e.message}')),
                            );
                          },
                          codeSent: (verificationId, resendToken) {
                            setState(() {
                              _verificationId = verificationId;
                              _codeSent = true;
                            });
                            ScaffoldMessenger.of(context)
                                .showSnackBar(const SnackBar(content: Text('Code sent')));
                          },
                          codeAutoRetrievalTimeout: (verificationId) {
                            _verificationId = verificationId;
                          },
                        );
                        setState(() => _loading = false);
                      } else {
                        if (_verificationId == null || _codeController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Enter the SMS code')),
                          );
                          return;
                        }
                        setState(() => _loading = true);
                        try {
                          final credential = PhoneAuthProvider.credential(
                            verificationId: _verificationId!,
                            smsCode: _codeController.text.trim(),
                          );
                          await FirebaseAuth.instance.signInWithCredential(credential);
                          final idToken = await FirebaseAuth.instance.currentUser!.getIdToken(true) ?? '';
                          final resp = await ApiService().loginWithFirebasePhone(
                            idToken: idToken,
                          );
                          if (resp['success'] == true) {
                            if (!mounted) return;
                            Navigator.pop(context);
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(resp['message'] ?? 'Login failed')),
                            );
                          }
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        } finally {
                          setState(() => _loading = false);
                        }
                      }
                    },
                    child: Text(_codeSent ? 'Verify' : 'Send Code'),
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}

