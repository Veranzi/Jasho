import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/security_service.dart';
import 'widgets/balance_card.dart';
import 'widgets/quick_actions.dart';
import 'widgets/recent_transactions.dart';
import 'widgets/ai_insights.dart';
import 'widgets/income_forecast.dart';
import '../jobs/job_heatmap_screen.dart';
import '../savings/savings_screen.dart';
import '../loans/loans_screen.dart';
import '../insurance/insurance_screen.dart';
import '../settings/settings_screen.dart';

class MainDashboard extends ConsumerStatefulWidget {
  const MainDashboard({super.key});

  @override
  ConsumerState<MainDashboard> createState() => _MainDashboardState();
}

class _MainDashboardState extends ConsumerState<MainDashboard> {
  int _selectedIndex = 0;
  final SecurityService _securityService = SecurityService();

  final List<Widget> _screens = [
    const DashboardHome(),
    const JobHeatmapScreen(),
    const SavingsScreen(),
    const LoansScreen(),
    const InsuranceScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() => _selectedIndex = index);
        },
        selectedItemColor: const Color(0xFF1E3A8A),
        unselectedItemColor: const Color(0xFF64748B),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            label: 'Jobs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.savings),
            label: 'Savings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance),
            label: 'Loans',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.security),
            label: 'Insurance',
          ),
        ],
      ),
    );
  }
}

class DashboardHome extends ConsumerStatefulWidget {
  const DashboardHome({super.key});

  @override
  ConsumerState<DashboardHome> createState() => _DashboardHomeState();
}

class _DashboardHomeState extends ConsumerState<DashboardHome> {
  final SecurityService _securityService = SecurityService();
  bool _isBalanceVisible = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A),
        elevation: 0,
        title: const Text(
          'HustleOS',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(_isBalanceVisible ? Icons.visibility : Icons.visibility_off),
            onPressed: () {
              setState(() => _isBalanceVisible = !_isBalanceVisible);
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Balance Card
            Container(
              margin: const EdgeInsets.all(16),
              child: BalanceCard(
                isVisible: _isBalanceVisible,
                onToggleVisibility: () {
                  setState(() => _isBalanceVisible = !_isBalanceVisible);
                },
              ),
            ),
            
            // Quick Actions
            const QuickActions(),
            
            // AI Insights
            const AIInsights(),
            
            // Income Forecast
            const IncomeForecast(),
            
            // Recent Transactions
            const RecentTransactions(),
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
