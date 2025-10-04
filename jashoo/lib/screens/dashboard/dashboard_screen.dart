// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import 'profile_drawer.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../providers/jobs_provider.dart';
import 'ai_assistant_screen.dart';
import 'transactions.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key});

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  int _selectedIndex = 0;

  static const Color primaryColor = Color(0xFF10B981);
  static const Color lightBlueBackground = Color(0xFFE6FFF5);

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
      title: Image.asset('assets/logo1.png', height: 32),
      centerTitle: true,
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
        return const TransactionHistoryScreen(embedded: true);
      case 2:
        return const AiAssistantScreen();
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
            child: LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 600) {
                  // Desktop/Tablet layout - rows
                  return Column(
                    children: [
                      _buildStatusCards(),
                      const SizedBox(height: 16),
                      // First row: Chart and Quick Actions
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: _buildEarningsSavingsChart(),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 1,
                            child: _buildServicesSection("Quick Actions", _quickActions),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Second row: Jobs shortcut and Insights
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: _buildJobsShortcut(),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 1,
                            child: _buildInsightsCard(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Third row: Task summary (full width)
                      _buildTaskSummary(),
                      const SizedBox(height: 24),
                    ],
                  );
                } else {
                  // Mobile layout - columns
                  return Column(
                    children: [
                      _buildStatusCards(),
                      const SizedBox(height: 16),
                      _buildEarningsSavingsChart(),
                      const SizedBox(height: 16),
                      _buildServicesSection("Quick Actions", _quickActions),
                      const SizedBox(height: 16),
                      _buildJobsShortcut(),
                      const SizedBox(height: 16),
                      _buildInsightsCard(),
                      const SizedBox(height: 16),
                      _buildTaskSummary(),
                      const SizedBox(height: 24),
                    ],
                  );
                }
              },
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
                  TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14.sp)),
          const SizedBox(height: 10),
          // Wallet balance and action buttons in same row
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Balance amount on the left
              Expanded(
                flex: 2,
                child: Text(
                  "$label ${balance.toStringAsFixed(isKes ? 0 : 2)}",
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 28.sp,
                      fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 12),
              // Action buttons on the right
              Expanded(
                flex: 3,
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: wallet.toggleCurrency,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: BorderSide(color: Colors.white.withOpacity(0.5)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        ),
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(isKes ? 'USDT' : 'KES', 
                            style: const TextStyle(fontSize: 10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pushNamed(context, '/deposit'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: BorderSide(color: Colors.white.withOpacity(0.5)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        ),
                        child: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text("DEPOSIT", style: TextStyle(fontSize: 10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pushNamed(context, '/withdraw'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: BorderSide(color: Colors.white.withOpacity(0.5)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        ),
                        child: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text("WITHDRAW", style: TextStyle(fontSize: 10)),
                        ),
                      ),
                    ),
                  ],
                ),
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
    return LayoutBuilder(
      builder: (context, constraints) {
        return Row(
          children: [
            Expanded(child: _buildStatusCard("Success", "12")),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard("Top Up", "5")),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard("Pending", "2")),
          ],
        );
      },
    );
  }

  Widget _buildStatusCard(String title, String value) {
    return Container(
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
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(title,
              style: TextStyle(color: Colors.grey[600], fontSize: 14.sp),
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87)),
        ],
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
              style: TextStyle(
                  fontSize: 18.sp,
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
    return SafeArea(
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Row(
                      children: const [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: primaryColor,
                          child: Icon(Icons.person, color: Colors.white, size: 40),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Your Profile',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Profile cards layout - two per row
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      children: [
                        // Row 1: Edit Profile and Points & Rewards
                        Row(
                          children: [
                            Expanded(
                              child: _buildProfileCard(
                                icon: Icons.edit,
                                title: 'Edit Profile',
                                subtitle: '',
                                onTap: () => Navigator.pushNamed(context, '/profileUpdate'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildProfileCard(
                                icon: Icons.emoji_events,
                                title: 'Jasho Points',
                                subtitle: '',
                                onTap: () => Navigator.pushNamed(context, '/gamification'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Row 2: Savings and Loans
                        Row(
                          children: [
                            Expanded(
                              child: _buildProfileCard(
                                icon: Icons.savings,
                                title: 'Savings',
                                subtitle: '',
                                onTap: () => Navigator.pushNamed(context, '/savings'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildProfileCard(
                                icon: Icons.account_balance,
                                title: 'Loans',
                                subtitle: '',
                                onTap: () => Navigator.pushNamed(context, '/loans'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Row 3: Insurance and Help & Support
                        Row(
                          children: [
                            Expanded(
                              child: _buildProfileCard(
                                icon: Icons.health_and_safety,
                                title: 'Insurance',
                                subtitle: '',
                                onTap: () => Navigator.pushNamed(context, '/insurance'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildProfileCard(
                                icon: Icons.help,
                                title: 'Help',
                                subtitle: '',
                                onTap: () => Navigator.pushNamed(context, '/help'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/changePassword'),
                    icon: const Icon(Icons.lock),
                    label: const Text('Password'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/logout'),
                    icon: const Icon(Icons.logout, color: Colors.red),
                    label: const Text('Logout'),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildProfileCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: primaryColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
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
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
            color: isSelected ? lightBlueBackground : Colors.transparent,
            borderRadius: BorderRadius.circular(20)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                color: isSelected ? primaryColor : Colors.grey[600], size: 24),
            const SizedBox(height: 2),
            Flexible(
              child: Text(label,
                  style: TextStyle(
                      color: isSelected ? primaryColor : Colors.grey[600],
                      fontSize: 10,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.normal),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1),
            ),
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
        children: [
          const Icon(Icons.insights, color: primaryColor),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'You earned 20% more than last week, save KES 500 to reach goal.',
              style: TextStyle(fontSize: 14.sp),
              overflow: TextOverflow.visible,
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
      child: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth > 300) {
            // Horizontal layout for larger screens
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text('Today\'s gigs', style: TextStyle(fontSize: 12.sp)),
                    Text('$todayJobs', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold)),
                  ],
                ),
                Column(
                  children: [
                    Text('Active', style: TextStyle(fontSize: 12.sp)),
                    Text('$inProgress', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold)),
                  ],
                ),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/jobs'),
                  child: Text('View jobs', style: TextStyle(fontSize: 12.sp)),
                ),
              ],
            );
          } else {
            // Vertical layout for smaller screens
            return Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        Text('Today\'s gigs', style: TextStyle(fontSize: 12.sp)),
                        Text('$todayJobs', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Column(
                      children: [
                        Text('Active', style: TextStyle(fontSize: 12.sp)),
                        Text('$inProgress', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/jobs'),
                    child: Text('View jobs', style: TextStyle(fontSize: 14.sp)),
                  ),
                ),
              ],
            );
          }
        },
      ),
    );
  }
}
