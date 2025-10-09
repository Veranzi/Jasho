import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/firebase_service.dart';
import '../auth/login_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _biometricEnabled = false;
  bool _darkModeEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A),
        title: const Text('Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: const Color(0xFF1E3A8A),
                    child: const Text(
                      'FL',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Faith Laboso',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '+254 700 000 000',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Verified',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF10B981),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () => _showEditProfileDialog(),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Security Settings
            _buildSectionTitle('Security'),
            _buildSettingsCard([
              _buildSettingsItem(
                'Biometric Authentication',
                'Use fingerprint or face ID',
                Icons.fingerprint,
                Switch(
                  value: _biometricEnabled,
                  onChanged: (value) {
                    setState(() => _biometricEnabled = value);
                  },
                ),
              ),
              _buildSettingsItem(
                'Transaction PIN',
                'Set up PIN for transactions',
                Icons.pin,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
              _buildSettingsItem(
                'Two-Factor Authentication',
                'Add extra security layer',
                Icons.security,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
            ]),
            
            const SizedBox(height: 24),
            
            // Notification Settings
            _buildSectionTitle('Notifications'),
            _buildSettingsCard([
              _buildSettingsItem(
                'Push Notifications',
                'Receive app notifications',
                Icons.notifications,
                Switch(
                  value: _notificationsEnabled,
                  onChanged: (value) {
                    setState(() => _notificationsEnabled = value);
                  },
                ),
              ),
              _buildSettingsItem(
                'SMS Notifications',
                'Receive SMS alerts',
                Icons.sms,
                Switch(
                  value: _notificationsEnabled,
                  onChanged: (value) {
                    setState(() => _notificationsEnabled = value);
                  },
                ),
              ),
              _buildSettingsItem(
                'Email Notifications',
                'Receive email updates',
                Icons.email,
                Switch(
                  value: _notificationsEnabled,
                  onChanged: (value) {
                    setState(() => _notificationsEnabled = value);
                  },
                ),
              ),
            ]),
            
            const SizedBox(height: 24),
            
            // App Settings
            _buildSectionTitle('App Settings'),
            _buildSettingsCard([
              _buildSettingsItem(
                'Dark Mode',
                'Switch to dark theme',
                Icons.dark_mode,
                Switch(
                  value: _darkModeEnabled,
                  onChanged: (value) {
                    setState(() => _darkModeEnabled = value);
                  },
                ),
              ),
              _buildSettingsItem(
                'Language',
                'English',
                Icons.language,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
              _buildSettingsItem(
                'Currency',
                'Kenyan Shilling (KES)',
                Icons.attach_money,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
            ]),
            
            const SizedBox(height: 24),
            
            // Support & Help
            _buildSectionTitle('Support & Help'),
            _buildSettingsCard([
              _buildSettingsItem(
                'Help Center',
                'Get help and support',
                Icons.help,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
              _buildSettingsItem(
                'Contact Us',
                'Reach out to our team',
                Icons.contact_support,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
              _buildSettingsItem(
                'Privacy Policy',
                'Read our privacy policy',
                Icons.privacy_tip,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
              _buildSettingsItem(
                'Terms of Service',
                'Read our terms of service',
                Icons.description,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
            ]),
            
            const SizedBox(height: 24),
            
            // Account Actions
            _buildSectionTitle('Account'),
            _buildSettingsCard([
              _buildSettingsItem(
                'Export Data',
                'Download your data',
                Icons.download,
                const Icon(Icons.arrow_forward_ios, size: 16),
              ),
              _buildSettingsItem(
                'Delete Account',
                'Permanently delete account',
                Icons.delete_forever,
                const Icon(Icons.arrow_forward_ios, size: 16),
                textColor: const Color(0xFFEF4444),
              ),
            ]),
            
            const SizedBox(height: 32),
            
            // Logout Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _logout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text(
                  'Logout',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Color(0xFF1E293B),
        ),
      ),
    );
  }

  Widget _buildSettingsCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildSettingsItem(String title, String subtitle, IconData icon, Widget trailing, {Color? textColor}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.1),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFF1E3A8A).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF1E3A8A),
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: textColor ?? const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }

  void _showEditProfileDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Profile'),
        content: const Text('This feature will allow you to edit your profile information.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await FirebaseService().signOut();
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Logout failed: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }
}
