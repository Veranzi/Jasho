// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
        return const Center(child: Text("AI Insights (Smart Predictions)"));
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
                _buildServicesSection("Quick Actions", _quickActions),
                const SizedBox(height: 24),
                _buildJobsShortcut(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWalletCard() {
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
              const Text(
                "KES 12,500",
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold),
              ),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withOpacity(0.5)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text("MANAGE"),
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
        // TODO: Handle tap
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
}
