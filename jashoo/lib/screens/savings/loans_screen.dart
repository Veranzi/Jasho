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
    final totalSaved = savings.goals.fold<double>(0, (sum, g) => sum + g.saved);
    final eligibility = (totalSaved * 0.5).toStringAsFixed(0); // 50% of savings
    return Scaffold(
      appBar: AppBar(title: const Text('Loans by Absa'), backgroundColor: const Color(0xFF0D47A1)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _EligibilityCard(eligibility: eligibility),
            const SizedBox(height: 16),
            _AbsaHighlightCard(),
            const SizedBox(height: 16),
            _LoanApplicationCard(
              controller: _amountController,
              onSubmit: (amt) {
                if (amt > 0) {
                  savings.requestLoan(amt);
                  _amountController.clear();
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Loan request submitted')));
                }
              },
              maxEligible: double.tryParse(eligibility) ?? 0,
            ),
            const SizedBox(height: 16),
            _SectionTitle('Your requests'),
            const SizedBox(height: 8),
            _LoanList(loans: savings.loans),
          ],
        ),
      ),
    );
  }
}

class _EligibilityCard extends StatelessWidget {
  final String eligibility;
  const _EligibilityCard({required this.eligibility});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.shade100),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.verified, color: Colors.green),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Eligibility based on your savings', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('You can request up to KES $eligibility'),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _AbsaHighlightCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF7B1FA2), Color(0xFFD81B60)]),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.account_balance, color: Colors.white),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Loans provided by Absa', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                SizedBox(height: 4),
                Text('Fast decisions. Fair rates. Tailored for hustlers.', style: TextStyle(color: Colors.white70)),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _LoanApplicationCard extends StatelessWidget {
  final TextEditingController controller;
  final void Function(double) onSubmit;
  final double maxEligible;
  const _LoanApplicationCard({required this.controller, required this.onSubmit, required this.maxEligible});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Apply for a loan', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Amount (KES)',
              helperText: 'Max eligible: KES ${maxEligible.toStringAsFixed(0)}',
              prefixIcon: const Icon(Icons.money),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                final amt = double.tryParse(controller.text.trim()) ?? 0;
                if (amt <= 0 || amt > maxEligible) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid amount within eligibility')));
                  return;
                }
                onSubmit(amt);
              },
              icon: const Icon(Icons.send),
              label: const Text('Submit request'),
            ),
          )
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) {
    return Text(text, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold));
  }
}

class _LoanList extends StatelessWidget {
  final List<LoanRequest> loans;
  const _LoanList({required this.loans});

  @override
  Widget build(BuildContext context) {
    if (loans.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
        ),
        child: const Text('No loan requests yet.'),
      );
    }
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: loans.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final loan = loans[i];
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
          ),
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              const Icon(Icons.receipt_long),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('KES ${loan.amount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(loan.status),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        );
      },
    );
  }
}

