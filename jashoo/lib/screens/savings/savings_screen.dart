import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/savings_provider.dart';

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
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Colors.blue.shade50,
            padding: const EdgeInsets.all(12),
            child: Text('Points from savings: ${savings.pointsEarnedFromSavings}',
                style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: savings.goals.length,
              itemBuilder: (context, index) {
                final goal = savings.goals[index];
                final progress = goal.target == 0 ? 0.0 : goal.saved / goal.target;
                return ListTile(
                  title: Text(goal.name),
                  subtitle: LinearProgressIndicator(value: progress.clamp(0.0, 1.0)),
                  trailing: Text('${goal.saved.toStringAsFixed(0)}/${goal.target.toStringAsFixed(0)}'),
                  onTap: () => _contributeDialog(context, goal.id),
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
                    controller: _nameController,
                    decoration: const InputDecoration(hintText: 'Goal name'),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 120,
                  child: TextField(
                    controller: _targetController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'Target'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    final name = _nameController.text.trim();
                    final target = double.tryParse(_targetController.text.trim()) ?? 0.0;
                    if (name.isEmpty || target <= 0) return;
                    savings.addGoal(SavingsGoal(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      name: name,
                      target: target,
                    ));
                    _nameController.clear();
                    _targetController.clear();
                  },
                  child: const Text('Add'),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Future<void> _contributeDialog(BuildContext context, String goalId) async {
    final controller = TextEditingController();
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
              }
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

