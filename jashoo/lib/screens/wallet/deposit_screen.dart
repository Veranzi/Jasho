import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/user_provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

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
      appBar: AppBar(
        title: Image.asset('assets/logo1.png', height: 28),
        centerTitle: true,
        backgroundColor: const Color(0xFF10B981),
      ),
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
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text('Deposit via $_method', style: TextStyle(fontSize: 16.sp)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

