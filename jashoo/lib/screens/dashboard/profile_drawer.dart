import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/locale_provider.dart';
import '../../providers/gamification_provider.dart';
import '../../providers/user_provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ProfileDrawer extends StatelessWidget {
  const ProfileDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final gamificationProvider = context.watch<GamificationProvider>();
    final user = context.watch<UserProvider>().profile;
    final isEnglish = localeProvider.languageCode == 'en';

    return Drawer(
      child: SafeArea(
        child: SingleChildScrollView( // ✅ prevents vertical overflow
          child: Column(
            children: [
              // Profile image - separate from header, left-aligned
              Container(
                padding: const EdgeInsets.all(16),
                alignment: Alignment.centerLeft,
                child: const CircleAvatar(
                  radius: 30,
                  backgroundColor: Color(0xFF10B981),
                  child: Icon(Icons.person, size: 40, color: Colors.white),
                ),
              ),
              
              // Name and work info - separate from image
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.fullName ?? 'User',
                      style: TextStyle(
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
                        color: Colors.grey[600],
                        fontSize: 14.sp,
                        overflow: TextOverflow.ellipsis,
                      ),
                      maxLines: 1,
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                  ],
                ),
              ),

              // Badges section
              if (gamificationProvider.badges.isNotEmpty) ...[
                const Divider(),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Badges',
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 80,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: gamificationProvider.badges.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final badge = gamificationProvider.badges[i];
                            return Container(
                              width: 160,
                              decoration: BoxDecoration(
                                color: Colors.grey[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey[300]!),
                              ),
                              padding: const EdgeInsets.all(8),
                              child: Row(
                                children: [
                                  const Icon(Icons.emoji_events, color: Colors.amber, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          badge.name,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                        Text(
                                          badge.description,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 10),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(),
              ],

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
