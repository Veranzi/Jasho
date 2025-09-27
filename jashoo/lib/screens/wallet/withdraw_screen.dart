import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/pin_provider.dart';
import '../../providers/user_provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

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
      appBar: AppBar(title: Text('Withdraw', style: TextStyle(fontSize: 16.sp)), backgroundColor: const Color(0xFF10B981)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 16),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Amount (KES)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _method,
                  decoration: InputDecoration(
                    labelText: 'Method', 
                    labelStyle: TextStyle(fontSize: 14.sp),
                    border: const OutlineInputBorder(),
                  ),
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
                    decoration: const InputDecoration(
                      labelText: 'M-PESA Number',
                      border: OutlineInputBorder(),
                    ),
                  )
                else
                  TextField(
                    controller: _absaAccountController,
                    keyboardType: TextInputType.text,
                    decoration: const InputDecoration(
                      labelText: 'ABSA Account Number',
                      border: OutlineInputBorder(),
                    ),
                  ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _category,
                  decoration: InputDecoration(
                    labelText: 'Category', 
                    labelStyle: TextStyle(fontSize: 14.sp),
                    border: const OutlineInputBorder(),
                  ),
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
                  decoration: InputDecoration(
                    labelText: 'Hustle (source)', 
                    labelStyle: TextStyle(fontSize: 14.sp),
                    border: const OutlineInputBorder(),
                  ),
                  items: (context.read<UserProvider>().profile?.skills ?? [])
                      .map((h) => DropdownMenuItem(value: h, child: Text(h)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedHustle = v),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final amt = double.tryParse(_amountController.text.trim());
                      if (amt == null || amt <= 0) return;
                      final ok = await _verifyPin(context);
                      if (!ok) return;
                      context.read<WalletProvider>().withdrawKes(amt, category: _category, method: _method, hustle: _selectedHustle);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text('Withdraw to $_method', style: TextStyle(fontSize: 16.sp)),
                  ),
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

