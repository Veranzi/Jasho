import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';

class ConvertScreen extends StatefulWidget {
  const ConvertScreen({super.key});

  @override
  State<ConvertScreen> createState() => _ConvertScreenState();
}

class _ConvertScreenState extends State<ConvertScreen> {
  final _amountController = TextEditingController();
  final _rateController = TextEditingController(text: '150.0'); // demo rate

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Convert KES ↔ USDT')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'KES Amount'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _rateController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'KES/USDT Rate'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final kes = double.tryParse(_amountController.text.trim());
                final rate = double.tryParse(_rateController.text.trim());
                if (kes == null || kes <= 0 || rate == null || rate <= 0) return;
                context.read<WalletProvider>().convertKesToUsdt(kes, rate);
                Navigator.pop(context);
              },
              child: const Text('Convert to USDT'),
            )
          ],
        ),
      ),
    );
  }
}

