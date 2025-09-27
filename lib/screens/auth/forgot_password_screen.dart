import 'package:flutter/material.dart';

class ForgotPass extends StatelessWidget {
  const ForgotPass({super.key});

  @override
  Widget build(BuildContext context) {
    final emailController = TextEditingController();
    return Scaffold(
      appBar: AppBar(title: const Text("Forgot Password")),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                TextField(controller: emailController, decoration: const InputDecoration(labelText: "Enter your email")),
                const SizedBox(height: 20),
                ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Reset link sent!")));
                    },
                    child: const Text("Send Reset Link")),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
