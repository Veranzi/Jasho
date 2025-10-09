import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RecentTransactions extends ConsumerWidget {
  const RecentTransactions({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mock transaction data
    final transactions = [
      Transaction(
        id: '1',
        title: 'Uber Earnings',
        subtitle: 'Today, 2:30 PM',
        amount: 1250.00,
        type: TransactionType.income,
        category: 'Transport',
        icon: Icons.directions_car,
        color: const Color(0xFF10B981),
      ),
      Transaction(
        id: '2',
        title: 'Glovo Delivery',
        subtitle: 'Today, 1:15 PM',
        amount: 850.00,
        type: TransactionType.income,
        category: 'Delivery',
        icon: Icons.delivery_dining,
        color: const Color(0xFF3B82F6),
      ),
      Transaction(
        id: '3',
        title: 'Fuel Expense',
        subtitle: 'Yesterday, 6:45 PM',
        amount: -2000.00,
        type: TransactionType.expense,
        category: 'Transport',
        icon: Icons.local_gas_station,
        color: const Color(0xFFEF4444),
      ),
      Transaction(
        id: '4',
        title: 'Food Delivery',
        subtitle: 'Yesterday, 12:30 PM',
        amount: 750.00,
        type: TransactionType.income,
        category: 'Delivery',
        icon: Icons.restaurant,
        color: const Color(0xFF8B5CF6),
      ),
      Transaction(
        id: '5',
        title: 'Savings Transfer',
        subtitle: 'Yesterday, 11:00 AM',
        amount: -500.00,
        type: TransactionType.savings,
        category: 'Savings',
        icon: Icons.savings,
        color: const Color(0xFFF59E0B),
      ),
    ];

    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Transactions',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              TextButton(
                onPressed: () {
                  // Navigate to all transactions
                },
                child: const Text(
                  'View All',
                  style: TextStyle(
                    color: Color(0xFF1E3A8A),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: transactions.map((transaction) => _buildTransactionItem(transaction)).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(Transaction transaction) {
    final isIncome = transaction.amount > 0;
    final amountColor = isIncome ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    final amountPrefix = isIncome ? '+' : '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.1),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: transaction.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              transaction.icon,
              color: transaction.color,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      transaction.subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: transaction.color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        transaction.category,
                        style: TextStyle(
                          fontSize: 10,
                          color: transaction.color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$amountPrefixKES ${transaction.amount.abs().toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: amountColor,
                ),
              ),
              const SizedBox(height: 4),
              Icon(
                isIncome ? Icons.arrow_upward : Icons.arrow_downward,
                size: 16,
                color: amountColor,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class Transaction {
  final String id;
  final String title;
  final String subtitle;
  final double amount;
  final TransactionType type;
  final String category;
  final IconData icon;
  final Color color;

  Transaction({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.type,
    required this.category,
    required this.icon,
    required this.color,
  });
}

enum TransactionType {
  income,
  expense,
  savings,
  transfer,
}
