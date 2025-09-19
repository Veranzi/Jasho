// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import 'profile_drawer.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../providers/jobs_provider.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key});

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  int _selectedIndex = 0;

  static const Color primaryColor = Color(0xFF0D47A1);
  static const Color lightBlueBackground = Color(0xFFE3F2FD);

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: primaryColor,
      statusBarIconBrightness: Brightness.light,
    ));

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: _buildAppBar(),
      drawer: const ProfileDrawer(),
      body: _buildBody(),
      bottomNavigationBar: _buildCustomBottomNavigationBar(),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      backgroundColor: primaryColor,
      elevation: 0,
      title: Row(
        children: [
          Image.asset('assets/logo.png', height: 28, color: Colors.white),
          const SizedBox(width: 12),
          const Text(
            "JASHO",
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications, color: Colors.white),
          onPressed: () {
            // TODO: Add notifications
          },
        ),
      ],
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboard();
      case 1:
        return const Center(child: Text("History Page (Transactions)"));
      case 2:
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => Navigator.pushNamed(context, '/aiAssistant'),
          child: const Center(child: Text("Open AI Insights")),
        );
      case 3:
        return _buildProfile();
      default:
        return _buildDashboard();
    }
  }

  /// ----------------- DASHBOARD (Home) -----------------
  Widget _buildDashboard() {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildWalletCard(),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              children: [
          _buildStatusCards(),
                const SizedBox(height: 24),
                _buildEarningsSavingsChart(),
                const SizedBox(height: 24),
          _buildServicesSection("Quick Actions", _quickActions),
                const SizedBox(height: 24),
                _buildJobsShortcut(),
                const SizedBox(height: 24),
          _buildInsightsCard(),
                const SizedBox(height: 24),
                _buildTaskSummary(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWalletCard() {
    final wallet = context.watch<WalletProvider>();
    final isKes = wallet.displayCurrency == Currency.kes;
    final balance = isKes ? wallet.kesBalance : wallet.usdtBalance;
    final label = isKes ? 'KES' : 'USDT';
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      decoration: const BoxDecoration(
        color: primaryColor,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Wallet Balance",
              style:
                  TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "$label ${balance.toStringAsFixed(isKes ? 0 : 2)}",
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  OutlinedButton(
                    onPressed: wallet.toggleCurrency,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withOpacity(0.5)),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20)),
                    ),
                    child: Text(isKes ? 'SHOW USDT' : 'SHOW KES'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () => Navigator.pushNamed(context, '/deposit'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withOpacity(0.5)),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Text("DEPOSIT"),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () => Navigator.pushNamed(context, '/withdraw'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withOpacity(0.5)),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Text("WITHDRAW"),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text("Flat commission discounts available",
                style: TextStyle(color: Colors.white, fontSize: 12)),
          )
        ],
      ),
    );
  }

  Widget _buildStatusCards() {
    return Row(
      children: [
        _buildStatusCard("Success", "12"),
        const SizedBox(width: 12),
        _buildStatusCard("Top Up", "5"),
        const SizedBox(width: 12),
        _buildStatusCard("Pending", "2"),
      ],
    );
  }

  Widget _buildStatusCard(String title, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.05),
                spreadRadius: 1,
                blurRadius: 10),
          ],
        ),
        child: Column(
          children: [
            Text(title,
                style: TextStyle(color: Colors.grey[600], fontSize: 14)),
            const SizedBox(height: 4),
            Text(value,
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87)),
          ],
        ),
      ),
    );
  }

  Widget _buildServicesSection(String title, List<Map<String, dynamic>> items) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.05),
                spreadRadius: 1,
                blurRadius: 10),
          ]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87)),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 8,
              mainAxisSpacing: 16,
            ),
            itemCount: items.length,
            itemBuilder: (context, index) {
              return _buildServiceItem(
                  items[index]['icon'], items[index]['label']);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildServiceItem(IconData icon, String label) {
    return GestureDetector(
      onTap: () {
        switch (label) {
          case 'Airtime':
            Navigator.pushNamed(context, '/deposit');
            break;
          case 'Electricity':
            Navigator.pushNamed(context, '/withdraw');
            break;
          case 'Water':
            Navigator.pushNamed(context, '/convert');
            break;
          case 'Internet':
            Navigator.pushNamed(context, '/aiAssistant');
            break;
        }
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: primaryColor, size: 28),
          const SizedBox(height: 8),
          Text(label,
              style: const TextStyle(fontSize: 12, color: Colors.black87),
              overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  /// Jobs Shortcut
  Widget _buildJobsShortcut() {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/jobs');
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: Colors.orange[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange, width: 1.2)),
        child: Row(
          children: [
            const Icon(Icons.work, color: Colors.orange, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text("Find New Jobs",
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text("Discover gigs and opportunities near you",
                      style: TextStyle(fontSize: 12, color: Colors.black54)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.orange),
          ],
        ),
      ),
    );
  }

  /// ----------------- PROFILE -----------------
  Widget _buildProfile() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const CircleAvatar(
          radius: 40,
          backgroundColor: primaryColor,
          child: Icon(Icons.person, color: Colors.white, size: 40),
        ),
        const SizedBox(height: 12),
        const Center(
            child: Text("John Doe",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
        const Center(child: Text("Gig Worker", style: TextStyle(fontSize: 14))),
        const Divider(height: 32),

        // Community
        ListTile(
          leading: const Icon(Icons.group, color: primaryColor),
          title: const Text("Community"),
          subtitle: const Text("Connect with other gig workers"),
          onTap: () {
            Navigator.pushNamed(context, '/community');
          },
        ),

        // Change Password
        ListTile(
          leading: const Icon(Icons.lock, color: primaryColor),
          title: const Text("Change Password"),
          onTap: () {
            Navigator.pushNamed(context, '/changePassword');
          },
        ),

        // Help
        ListTile(
          leading: const Icon(Icons.help, color: primaryColor),
          title: const Text("Help"),
          onTap: () {
            Navigator.pushNamed(context, '/help');
          },
        ),

        // Settings
        ListTile(
          leading: const Icon(Icons.settings, color: primaryColor),
          title: const Text("Settings"),
          onTap: () {
            Navigator.pushNamed(context, '/profileUpdate');
          },
        ),

        // Logout
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text("Logout"),
          onTap: () {
            Navigator.pushNamed(context, '/logout');
          },
        ),
      ],
    );
  }

  /// ----------------- BOTTOM NAV -----------------
  Widget _buildCustomBottomNavigationBar() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(color: Colors.white, boxShadow: [
        BoxShadow(
            color: Colors.black.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 10),
      ]),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(Icons.home, "Home", 0),
            _buildNavItem(Icons.history, "History", 1),
            _buildNavItem(Icons.insights, "AI Insight", 2),
            _buildNavItem(Icons.person, "Profile", 3),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
            color: isSelected ? lightBlueBackground : Colors.transparent,
            borderRadius: BorderRadius.circular(20)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                color: isSelected ? primaryColor : Colors.grey[600], size: 26),
            const SizedBox(height: 4),
            Text(label,
                style: TextStyle(
                    color: isSelected ? primaryColor : Colors.grey[600],
                    fontSize: 12,
                    fontWeight:
                        isSelected ? FontWeight.bold : FontWeight.normal)),
          ],
        ),
      ),
    );
  }

  /// ----------------- DATA -----------------
  final List<Map<String, dynamic>> _quickActions = [
    {'icon': Icons.phone_android, 'label': 'Airtime'},
    {'icon': Icons.lightbulb, 'label': 'Electricity'},
    {'icon': Icons.water_drop, 'label': 'Water'},
    {'icon': Icons.wifi, 'label': 'Internet'},
  ];

  Widget _buildInsightsCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: const [
          Icon(Icons.insights, color: primaryColor),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'You earned 20% more than last week, save KES 500 to reach goal.',
              style: TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsSavingsChart() {
    final spotsEarnings = [
      const FlSpot(0, 2),
      const FlSpot(1, 3),
      const FlSpot(2, 4),
      const FlSpot(3, 3.5),
      const FlSpot(4, 5),
      const FlSpot(5, 6),
      const FlSpot(6, 7),
    ];
    final spotsSavings = [
      const FlSpot(0, 1),
      const FlSpot(1, 1.2),
      const FlSpot(2, 1.4),
      const FlSpot(3, 1.8),
      const FlSpot(4, 2),
      const FlSpot(5, 2.5),
      const FlSpot(6, 3),
    ];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Earnings vs Savings (Weekly)',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spotsEarnings,
                    isCurved: true,
                    color: Colors.green,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                  ),
                  LineChartBarData(
                    spots: spotsSavings,
                    isCurved: true,
                    color: Colors.blue,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaskSummary() {
    final jobs = context.watch<JobsProvider>();
    final todayJobs = jobs.jobs.where((j) => j.status == JobStatus.pending).length;
    final inProgress = jobs.jobs.where((j) => j.status == JobStatus.inProgress).length;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Column(
            children: [
              const Text('Today\'s gigs'),
              Text('$todayJobs', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          Column(
            children: [
              const Text('Active'),
              Text('$inProgress', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          TextButton(
            onPressed: () => Navigator.pushNamed(context, '/jobs'),
            child: const Text('View jobs'),
          ),
        ],
      ),
    );
  }
}
