import 'package:flutter/material.dart';

class ProfileDrawer extends StatelessWidget {
  const ProfileDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Color(0xFF0D47A1), // JASHO primary blue
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.person, size: 40, color: Color(0xFF0D47A1)),
                ),
                SizedBox(height: 10),
                Text("John Doe",
                    style: TextStyle(color: Colors.white, fontSize: 18)),
                Text("Gig Worker",
                    style: TextStyle(color: Colors.white70, fontSize: 14)),
              ],
            ),
          ),

          // Community
          ListTile(
            leading: const Icon(Icons.group, color: Colors.blue),
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
