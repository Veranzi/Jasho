import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/pin_provider.dart';
import '../../providers/user_provider.dart';

class WithdrawScreen extends StatefulWidget {
  const WithdrawScreen({super.key});

  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _amountController = TextEditingController();
  String _method = 'M-PESA';
  String _category = 'Food';
  final _mpesaNumberController = TextEditingController();
  final _absaAccountController = TextEditingController();
  String? _selectedHustle;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Withdraw'), backgroundColor: const Color(0xFF0D47A1)),
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
              value: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: const [
                DropdownMenuItem(value: 'Food', child: Text('Food')),
                DropdownMenuItem(value: 'Electricity', child: Text('Electricity')),
                DropdownMenuItem(value: 'Water', child: Text('Water')),
                DropdownMenuItem(value: 'Internet', child: Text('Internet')),
                DropdownMenuItem(value: 'Transport', child: Text('Transport')),
                DropdownMenuItem(value: 'Other', child: Text('Other')),
              ],
              onChanged: (v) => setState(() => _category = v ?? 'Food'),
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
              onPressed: () async {
                final amt = double.tryParse(_amountController.text.trim());
                if (amt == null || amt <= 0) return;
                final ok = await _verifyPin(context);
                if (!ok) return;
                context.read<WalletProvider>().withdrawKes(amt, category: _category, method: _method, hustle: _selectedHustle);
                Navigator.pop(context);
              },
              child: Text('Withdraw to $_method'),
            ),
          ],
        ),
          ),
        ),
      ),
    );
  }

  Future<bool> _verifyPin(BuildContext context) async {
    final pinController = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Enter PIN'),
        content: TextField(
          controller: pinController,
          obscureText: true,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'PIN'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              final pin = pinController.text.trim();
              final ok = context.read<PinProvider>().verify(pin);
              Navigator.pop(context, ok);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    return result ?? false;
  }
}

