import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/gamification_provider.dart';

class GamificationScreen extends StatelessWidget {
  const GamificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final g = context.watch<GamificationProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Jasho Points'),
        actions: [
          IconButton(
            icon: const Icon(Icons.leaderboard),
            onPressed: () => Navigator.pushNamed(context, '/leaderboard'),
            tooltip: 'Leaderboard',
          ),
          IconButton(
            icon: const Icon(Icons.card_giftcard),
            onPressed: () => Navigator.pushNamed(context, '/rewards'),
            tooltip: 'Rewards',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Points: ${g.points}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            Text('Level: ${g.level}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => g.earnPoints(100),
              child: const Text('Simulate +100 points'),
            ),
            const SizedBox(height: 20),
            const Text('Badges', style: TextStyle(fontWeight: FontWeight.bold)),
            Expanded(
              child: ListView.builder(
                itemCount: g.badges.length,
                itemBuilder: (_, i) {
                  final b = g.badges[i];
                  return ListTile(
                    leading: const Icon(Icons.emoji_events),
                    title: Text(b.name),
                    subtitle: Text(b.description),
                  );
                },
              ),
            )
          ],
        ),
      ),
    );
  }
}

