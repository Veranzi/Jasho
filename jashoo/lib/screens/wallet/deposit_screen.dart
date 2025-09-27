import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/user_provider.dart';

class DepositScreen extends StatefulWidget {
  const DepositScreen({super.key});

  @override
  State<DepositScreen> createState() => _DepositScreenState();
}

class _DepositScreenState extends State<DepositScreen> {
  final _amountController = TextEditingController();
  String _method = 'M-PESA';
  final _mpesaNumberController = TextEditingController();
  final _absaAccountController = TextEditingController();
  String? _selectedHustle;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Deposit'), backgroundColor: const Color(0xFF0D47A1)),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Amount (KES)'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _method,
                  decoration: const InputDecoration(labelText: 'Method'),
                  items: const [
                    DropdownMenuItem(value: 'M-PESA', child: Text('M-PESA')),
                    DropdownMenuItem(value: 'ABSA Bank', child: Text('ABSA Bank')),
                  ],
                  onChanged: (v) => setState(() => _method = v ?? 'M-PESA'),
                ),
                const SizedBox(height: 12),
                if (_method == 'M-PESA')
                  TextField(
                    controller: _mpesaNumberController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'M-PESA Number'),
                  )
                else
                  TextField(
                    controller: _absaAccountController,
                    keyboardType: TextInputType.text,
                    decoration: const InputDecoration(labelText: 'ABSA Account Number'),
                  ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _selectedHustle,
                  decoration: const InputDecoration(labelText: 'Hustle (source)'),
                  items: (context.read<UserProvider>().profile?.skills ?? [])
                      .map((h) => DropdownMenuItem(value: h, child: Text(h)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedHustle = v),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    final amt = double.tryParse(_amountController.text.trim());
                    if (amt == null || amt <= 0) return;
                    context.read<WalletProvider>().depositKes(
                          amt,
                          description: '$_method Deposit',
                          method: _method,
                          hustle: _selectedHustle,
                        );
                    Navigator.pop(context);
                  },
                  child: Text('Deposit via $_method'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

