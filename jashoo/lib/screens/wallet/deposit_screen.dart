import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';

class DepositScreen extends StatefulWidget {
  const DepositScreen({super.key});

  @override
  State<DepositScreen> createState() => _DepositScreenState();
}

class _DepositScreenState extends State<DepositScreen> {
  final _amountController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Deposit')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (KES)'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final amt = double.tryParse(_amountController.text.trim());
                if (amt == null || amt <= 0) return;
                context.read<WalletProvider>().depositKes(amt, description: 'M-PESA Deposit');
                Navigator.pop(context);
              },
              child: const Text('Deposit via M-PESA'),
            ),
          ],
        ),
      ),
    );
  }
}

