import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/ai_provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AiAssistantScreen extends StatelessWidget {
  const AiAssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ai = context.watch<AiProvider>();
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Jasho Insights'),
        backgroundColor: const Color(0xFF10B981),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
        children: [
          // Removed language switch; now controlled globally via drawer
          // Period toggles
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
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
                      color: Color(0xFF10B981),
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
          const SizedBox(height: 8),
          // Expenditure breakdown
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), spreadRadius: 1, blurRadius: 10)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Expenditure (This Week)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14.sp)),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 150,
                    child: Row(
                      children: [
                        Expanded(
                          child: PieChart(
                            PieChartData(
                              sectionsSpace: 2,
                              centerSpaceRadius: 24,
                              sections: _expenditureSections(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _legend(color: Colors.orange, label: 'Food'),
                              _legend(color: Colors.lightBlue, label: 'Electricity'),
                              _legend(color: Colors.teal, label: 'Water'),
                              _legend(color: Colors.deepPurple, label: 'Internet'),
                              _legend(color: Colors.grey, label: 'Other'),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
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
        ],
      ),
        ),
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
          const Icon(Icons.trending_up, color: Color(0xFF10B981)),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }

  List<PieChartSectionData> _expenditureSections() {
    return [
      PieChartSectionData(value: 35, color: Colors.orange, title: ''),
      PieChartSectionData(value: 20, color: Colors.lightBlue, title: ''),
      PieChartSectionData(value: 15, color: Colors.teal, title: ''),
      PieChartSectionData(value: 18, color: Colors.deepPurple, title: ''),
      PieChartSectionData(value: 12, color: Colors.grey, title: ''),
    ];
  }

  Widget _legend({required Color color, required String label}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Container(width: 10, height: 10, color: color),
          const SizedBox(width: 6),
          Text(label),
        ],
      ),
    );
  }
}
