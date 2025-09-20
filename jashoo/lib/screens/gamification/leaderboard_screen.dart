import 'package:flutter/material.dart';

class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final entries = const [
      {'name': 'Alice', 'points': 5400, 'city': 'Nairobi'},
      {'name': 'Brian', 'points': 5200, 'city': 'Mombasa'},
      {'name': 'Carol', 'points': 4900, 'city': 'Nairobi'},
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard'), backgroundColor: const Color(0xFF0D47A1)),
      body: ListView.builder(
        itemCount: entries.length,
        itemBuilder: (_, i) => ListTile(
          leading: CircleAvatar(child: Text('#${i + 1}')),
          title: Text(entries[i]['name'].toString()),
          subtitle: Text(entries[i]['city'].toString()),
          trailing: Text('${entries[i]['points']} pts'),
        ),
      ),
    );
  }
}

