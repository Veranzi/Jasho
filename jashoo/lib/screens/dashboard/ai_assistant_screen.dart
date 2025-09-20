import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/ai_provider.dart';

class AiAssistantScreen extends StatelessWidget {
  const AiAssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ai = context.watch<AiProvider>();
    final isEnglish = ai.languageCode == 'en';
    return Scaffold(
      appBar: AppBar(title: const Text('Jasho Insights'), backgroundColor: const Color(0xFF0D47A1)),
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
          // Period toggles
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Row(
              children: [
                ChoiceChip(label: const Text('Daily'), selected: true, onSelected: (_) {}),
                const SizedBox(width: 8),
                ChoiceChip(label: const Text('Weekly'), selected: false, onSelected: (_) {}),
                const SizedBox(width: 8),
                ChoiceChip(label: const Text('Monthly'), selected: false, onSelected: (_) {}),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Earnings vs Savings chart
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Container(
              height: 180,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), spreadRadius: 1, blurRadius: 10),
                ],
              ),
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: const [FlSpot(0, 2), FlSpot(1, 3.5), FlSpot(2, 4.2), FlSpot(3, 5)],
                      isCurved: true,
                      color: Colors.green,
                      barWidth: 3,
                      dotData: const FlDotData(show: false),
                    ),
                    LineChartBarData(
                      spots: const [FlSpot(0, 1), FlSpot(1, 1.6), FlSpot(2, 2.2), FlSpot(3, 3)],
                      isCurved: true,
                      color: Colors.blue,
                      barWidth: 3,
                      dotData: const FlDotData(show: false),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Predictions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Column(
              children: [
                _predictionCard(isEnglish ? 'You earned 20% more than last week.' : 'Ulipata 20% zaidi kuliko wiki iliyopita.'),
                const SizedBox(height: 8),
                _predictionCard(isEnglish ? 'Cleaning jobs rise on weekends.' : 'Kazi za usafi huongezeka wikendi.'),
                const SizedBox(height: 8),
                _predictionCard(isEnglish ? 'Save KES 500 to reach your goal.' : 'Weka KES 500 kufikia lengo.'),
              ],
            ),
          ),
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

  Widget _predictionCard(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), spreadRadius: 1, blurRadius: 10)],
      ),
      child: Row(
        children: [
          const Icon(Icons.trending_up, color: Color(0xFF0D47A1)),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}

