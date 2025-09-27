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
      child: SafeArea(
        child: SingleChildScrollView( // ✅ prevents vertical overflow
          child: Column(
            children: [
              DrawerHeader(
                margin: EdgeInsets.zero,
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(color: Color(0xFF10B981)),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile image on the left
                    const CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, size: 40, color: Color(0xFF10B981)),
                    ),
                    const SizedBox(width: 16),
                    // Name and work info on the right, left-aligned
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          Text(
                            "John Doe",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18.sp,
                              fontWeight: FontWeight.bold,
                              overflow: TextOverflow.ellipsis,
                            ),
                            maxLines: 1,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Gig Worker",
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14.sp,
                              overflow: TextOverflow.ellipsis,
                            ),
                            maxLines: 1,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Community
              ListTile(
                leading: const Icon(Icons.group, color: Color(0xFF10B981)),
                title: Text("Community", style: TextStyle(fontSize: 16.sp)),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/community');
                },
              ),

              // Jobs Marketplace
              ListTile(
                leading: const Icon(Icons.work, color: Colors.orange),
                title: Text("Jobs Marketplace", style: TextStyle(fontSize: 16.sp)),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/jobs');
                },
              ),

              // Update Profile
              ListTile(
                leading: const Icon(Icons.person_outline, color: Colors.teal),
                title: Text("Update Profile", style: TextStyle(fontSize: 16.sp)),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/profileUpdate');
                },
              ),

              // Change Password
              ListTile(
                leading: const Icon(Icons.lock, color: Colors.deepPurple),
                title: Text("Change Password", style: TextStyle(fontSize: 16.sp)),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/changePassword');
                },
              ),

              // Help
              ListTile(
                leading: const Icon(Icons.help_outline, color: Colors.green),
                title: Text("Help & Support", style: TextStyle(fontSize: 16.sp)),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/help');
                },
              ),

              const Divider(),

              // Language switch
              SwitchListTile(
                secondary: const Icon(Icons.language, color: Color(0xFF10B981)),
                title: Text("Language", style: TextStyle(fontSize: 16.sp)),
                subtitle: Text(isEnglish ? 'English' : 'Swahili',
                    style: TextStyle(fontSize: 14.sp)),
                value: isEnglish,
                onChanged: (val) {
                  final newCode = val ? 'en' : 'sw';
                  context.read<LocaleProvider>().setLanguage(newCode);
                },
              ),

              // Logout
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: Text("Logout", style: TextStyle(fontSize: 16.sp)),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushReplacementNamed(context, '/logout');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
