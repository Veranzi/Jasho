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
  String _direction = 'KES → USDT';

  Future<String?> _promptPin() async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Enter PIN'),
        content: TextField(
          controller: controller,
          obscureText: true,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'PIN'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, null), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Confirm')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Image.asset('assets/logo1.png', height: 28),
        centerTitle: true,
        backgroundColor: const Color(0xFF10B981),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'KES Amount'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _direction,
              decoration: const InputDecoration(labelText: 'Direction'),
              items: const [
                DropdownMenuItem(value: 'KES → USDT', child: Text('KES → USDT')),
                DropdownMenuItem(value: 'USDT → KES', child: Text('USDT → KES')),
              ],
              onChanged: (v) => setState(() => _direction = v ?? 'KES → USDT'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _rateController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'KES/USDT Rate'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final kes = double.tryParse(_amountController.text.trim());
                final rate = double.tryParse(_rateController.text.trim());
                if (kes == null || kes <= 0 || rate == null || rate <= 0) return;
                if (_direction == 'KES → USDT') {
                  final pin = await _promptPin();
                  if (pin == null || pin.isEmpty) return;
                  await context.read<WalletProvider>().convertKesToUsdt(
                    kesAmount: kes,
                    rate: rate,
                    pin: pin,
                  );
                } else {
                  // reverse conversion: simple demo
                  final wallet = context.read<WalletProvider>();
                  final requiredKes = kes * rate;
                  wallet.depositKes(amount: requiredKes, description: 'Convert USDT to KES');
                }
                Navigator.pop(context);
              },
              child: Text('Convert ($_direction)'),
            )
          ],
        ),
          ),
        ),
      ),
    );
  }
}

