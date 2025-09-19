import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/savings_provider.dart';

class LoansScreen extends StatefulWidget {
  const LoansScreen({super.key});

  @override
  State<LoansScreen> createState() => _LoansScreenState();
}

class _LoansScreenState extends State<LoansScreen> {
  final _amountController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final savings = context.watch<SavingsProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Microloans')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: savings.loans.length,
              itemBuilder: (context, index) {
                final loan = savings.loans[index];
                return ListTile(
                  title: Text('KES ${loan.amount.toStringAsFixed(0)}'),
                  subtitle: Text(loan.status),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'Amount'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    final amt = double.tryParse(_amountController.text.trim()) ?? 0;
                    if (amt > 0) {
                      savings.requestLoan(amt);
                      _amountController.clear();
                    }
                  },
                  child: const Text('Request'),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

