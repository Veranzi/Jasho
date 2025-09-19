import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/ai_provider.dart';

class AiAssistantScreen extends StatelessWidget {
  const AiAssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ai = context.watch<AiProvider>();
    final isEnglish = ai.languageCode == 'en';
    return Scaffold(
      appBar: AppBar(title: const Text('Jasho Insights')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                const Text('Language:'),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('English'),
                  selected: isEnglish,
                  onSelected: (_) => ai.setLanguage('en'),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Swahili'),
                  selected: !isEnglish,
                  onSelected: (_) => ai.setLanguage('sw'),
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: ListView.builder(
              itemCount: ai.suggestions.length,
              itemBuilder: (context, index) {
                final s = ai.suggestions[index];
                final text = isEnglish ? s.messageEn : s.messageSw;
                return ListTile(
                  leading: const Icon(Icons.insights),
                  title: Text(text),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

