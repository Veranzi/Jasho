import 'package:flutter/material.dart';

class ChangePassword extends StatelessWidget {
  const ChangePassword({super.key});

  @override
  Widget build(BuildContext context) {
    final newPasswordController = TextEditingController();
    return Scaffold(
      appBar: AppBar(title: const Text("Change Password")),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                TextField(controller: newPasswordController, decoration: const InputDecoration(labelText: "New Password"), obscureText: true),
                const SizedBox(height: 20),
                ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Password updated!")));
                    },
                    child: const Text("Update Password")),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
