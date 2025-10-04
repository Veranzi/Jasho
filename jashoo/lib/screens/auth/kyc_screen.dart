import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/user_provider.dart';

class KycScreen extends StatefulWidget {
  const KycScreen({super.key});

  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _idType;
  final _idNumberController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('KYC Verification')),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: _idType,
                    items: const [
                      DropdownMenuItem(value: 'ID', child: Text('National ID')),
                      DropdownMenuItem(value: 'PASSPORT', child: Text('Passport')),
                    ],
                    onChanged: (v) => setState(() => _idType = v),
                    decoration: const InputDecoration(labelText: 'Document Type'),
                    validator: (v) => v == null ? 'Select document type' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _idNumberController,
                    decoration: const InputDecoration(labelText: 'Document Number'),
                    validator: (v) => v == null || v.isEmpty ? 'Enter ID number' : null,
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () {
                      if (!_formKey.currentState!.validate()) return;
                      context.read<UserProvider>().completeKyc(
                            idType: _idType!,
                            idNumber: _idNumberController.text.trim(),
                          );
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('KYC submitted')),
                      );
                      Navigator.pop(context);
                    },
                    child: const Text('Submit'),
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

