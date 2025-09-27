import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/locale_provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ProfileDrawer extends StatelessWidget {
  const ProfileDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final isEnglish = localeProvider.languageCode == 'en';
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Color(0xFF10B981),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.person, size: 40, color: Color(0xFF10B981)),
                ),
                SizedBox(height: 10),
                Text("John Doe",
                    style: TextStyle(color: Colors.white, fontSize: 18).copyWith(fontSize: 18.sp)),
                Text("Gig Worker",
                    style: TextStyle(color: Colors.white70, fontSize: 14).copyWith(fontSize: 14.sp)),
              ],
            ),
          ),

          // Community
          ListTile(
            leading: const Icon(Icons.group, color: Color(0xFF10B981)),
            title: const Text("Community"),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/community');
            },
          ),

          // Jobs Marketplace
          ListTile(
            leading: const Icon(Icons.work, color: Colors.orange),
            title: const Text("Jobs Marketplace"),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/jobs');
            },
          ),

          // Update Profile
          ListTile(
            leading: const Icon(Icons.person_outline, color: Colors.teal),
            title: const Text("Update Profile"),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/profileUpdate');
            },
          ),

          // Change Password
          ListTile(
            leading: const Icon(Icons.lock, color: Colors.deepPurple),
            title: const Text("Change Password"),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/changePassword');
            },
          ),

          // Help
          ListTile(
            leading: const Icon(Icons.help_outline, color: Colors.green),
            title: const Text("Help & Support"),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/help');
            },
          ),

          const Divider(),

          // Language switch
          SwitchListTile(
            secondary: const Icon(Icons.language, color: Color(0xFF10B981)),
            title: const Text("Language"),
            subtitle: Text(isEnglish ? 'English' : 'Swahili'),
            value: isEnglish,
            onChanged: (val) {
              final newCode = val ? 'en' : 'sw';
              context.read<LocaleProvider>().setLanguage(newCode);
            },
          ),

          // Logout
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text("Logout"),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/logout');
            },
          ),
        ],
      ),
    );
  }
}
