import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AIInsights extends ConsumerWidget {
  const AIInsights({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mock AI insights data
    final insights = [
      AIInsight(
        title: 'Income Pattern Detected',
        description: 'Your highest earning day is Friday with an average of KES 1,250',
        type: InsightType.income,
        priority: Priority.medium,
        icon: Icons.trending_up,
        color: const Color(0xFF10B981),
      ),
      AIInsight(
        title: 'Savings Opportunity',
        description: 'You could save 15% more by reducing food expenses',
        type: InsightType.savings,
        priority: Priority.high,
        icon: Icons.savings,
        color: const Color(0xFF3B82F6),
      ),
      AIInsight(
        title: 'Credit Score Improved',
        description: 'Your credit score increased by 25 points this month',
        type: InsightType.credit,
        priority: Priority.low,
        icon: Icons.credit_score,
        color: const Color(0xFF8B5CF6),
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
                'AI Insights',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              TextButton(
                onPressed: () {
                  // Navigate to detailed insights
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
          ...insights.map((insight) => _buildInsightCard(insight)).toList(),
        ],
      ),
    );
  }

  Widget _buildInsightCard(AIInsight insight) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: insight.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              insight.icon,
              color: insight.color,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        insight.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                    ),
                    _buildPriorityIndicator(insight.priority),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  insight.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityIndicator(Priority priority) {
    Color color;
    switch (priority) {
      case Priority.high:
        color = const Color(0xFFEF4444);
        break;
      case Priority.medium:
        color = const Color(0xFFF59E0B);
        break;
      case Priority.low:
        color = const Color(0xFF10B981);
        break;
    }

    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }
}

class AIInsight {
  final String title;
  final String description;
  final InsightType type;
  final Priority priority;
  final IconData icon;
  final Color color;

  AIInsight({
    required this.title,
    required this.description,
    required this.type,
    required this.priority,
    required this.icon,
    required this.color,
  });
}

enum InsightType {
  income,
  savings,
  credit,
  expense,
  fraud,
}

enum Priority {
  high,
  medium,
  low,
}
