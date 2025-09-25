import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/savings_provider.dart';
import '../../providers/gamification_provider.dart';
import '../../widgets/skeleton.dart';

class SavingsScreen extends StatefulWidget {
  const SavingsScreen({super.key});

  @override
  State<SavingsScreen> createState() => _SavingsScreenState();
}

class _SavingsScreenState extends State<SavingsScreen> {
  final _nameController = TextEditingController();
  final _targetController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final savings = context.watch<SavingsProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Savings'), backgroundColor: const Color(0xFF0D47A1)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openCreateGoalSheet(context, savings),
        icon: const Icon(Icons.add),
        label: const Text('New goal'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _PointsFromSavings(points: savings.pointsEarnedFromSavings),
            const SizedBox(height: 16),
            _SectionTitle('Your goals'),
            const SizedBox(height: 8),
            _GoalsList(
              goals: savings.goals,
              onContribute: (id) => _contributeDialog(context, id),
            ),
            const SizedBox(height: 16),
            _SectionTitle('Hustle breakdown'),
            const SizedBox(height: 8),
            _HustleBreakdown(data: savings.hustleSavings),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Future<void> _contributeDialog(BuildContext context, String goalId) async {
    final controller = TextEditingController();
    final hustleController = TextEditingController();
    return showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Contribute'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Amount'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              final amt = double.tryParse(controller.text.trim()) ?? 0;
              if (amt > 0) {
                context.read<SavingsProvider>().contribute(goalId, amt);
                context.read<GamificationProvider>().earnPoints(amt.floor());
              }
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _openCreateGoalSheet(BuildContext context, SavingsProvider savings) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Create savings goal', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Goal name', prefixIcon: Icon(Icons.flag)),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _targetController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Target amount (KES)', prefixIcon: Icon(Icons.savings)),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    final name = _nameController.text.trim();
                    final target = double.tryParse(_targetController.text.trim()) ?? 0.0;
                    if (name.isEmpty || target <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter name and valid target')));
                      return;
                    }
                    savings.addGoal(SavingsGoal(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      name: name,
                      target: target,
                    ));
                    _nameController.clear();
                    _targetController.clear();
                    Navigator.pop(ctx);
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('Create goal'),
                ),
              )
            ],
          ),
        );
      },
    );
  }
}

class _PointsFromSavings extends StatelessWidget {
  final int points;
  const _PointsFromSavings({required this.points});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade100),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Icon(Icons.workspace_premium, color: Color(0xFF0D47A1)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Points earned from savings', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('$points pts'),
              ],
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

class _GoalsList extends StatelessWidget {
  final List<SavingsGoal> goals;
  final void Function(String id) onContribute;
  const _GoalsList({required this.goals, required this.onContribute});

  @override
  Widget build(BuildContext context) {
    if (goals.isEmpty) {
      return Column(
        children: const [
          Skeleton(height: 90),
          SizedBox(height: 8),
          Skeleton(height: 90),
          SizedBox(height: 8),
          Skeleton(height: 90),
        ],
      );
    }
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: goals.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final goal = goals[i];
        final progress = goal.target == 0 ? 0.0 : goal.saved / goal.target;
        return AnimatedScale(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutBack,
          scale: 1.0,
          child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
          ),
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.flag),
                  const SizedBox(width: 8),
                  Expanded(child: Text(goal.name, style: const TextStyle(fontWeight: FontWeight.bold))),
                  Text('KES ${goal.saved.toStringAsFixed(0)} / ${goal.target.toStringAsFixed(0)}'),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: progress.clamp(0.0, 1.0),
                  minHeight: 8,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  OutlinedButton(
                    onPressed: () => onContribute(goal.id),
                    child: const Text('Contribute'),
                  ),
                ],
              )
            ],
          ),
        );
        );
      },
    );
  }
}

class _HustleBreakdown extends StatelessWidget {
  final Map<String, double> data;
  const _HustleBreakdown({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
        ),
        child: const Text('No hustle breakdown yet.'),
      );
    }
    return Column(
      children: data.entries.map((e) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
          ),
          child: Row(
            children: [
              const Icon(Icons.work_outline),
              const SizedBox(width: 8),
              Expanded(child: Text(e.key)),
              Text('KES ${e.value.toStringAsFixed(0)}'),
            ],
          ),
        );
      }).toList(),
    );
  }
}

