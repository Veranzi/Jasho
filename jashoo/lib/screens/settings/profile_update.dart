import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/user_provider.dart';

class UpdateProfilePage extends StatefulWidget {
  const UpdateProfilePage({super.key});

  @override
  State<UpdateProfilePage> createState() => _UpdateProfilePageState();
}

class _UpdateProfilePageState extends State<UpdateProfilePage> {
  final _formKey = GlobalKey<FormState>();

  final nameController = TextEditingController();
  final mobileController = TextEditingController();
  final emailController = TextEditingController();
  final addressController = TextEditingController();
  final pincodeController = TextEditingController();
  final absaAccountController = TextEditingController();
  bool _maskAbsa = true;

  @override
  void initState() {
    super.initState();
    // Preload Absa account if available
    final profile = context.read<UserProvider>().profile;
    if (profile?.absaAccountNumber != null) {
      absaAccountController.text = profile!.absaAccountNumber!;
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    mobileController.dispose();
    emailController.dispose();
    addressController.dispose();
    pincodeController.dispose();
    absaAccountController.dispose();
    super.dispose();
  }

  void _updateProfile() {
    if (_formKey.currentState!.validate()) {
      final absa = absaAccountController.text.trim();
      if (absa.isNotEmpty) {
        context.read<UserProvider>().linkAbsaAccount(absa);
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile updated successfully!")),
      );

      Navigator.pop(context); // go back after update
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Edit Profile"),
        actions: [
          IconButton(
            icon: const Icon(Icons.verified_user),
            onPressed: () => Navigator.pushNamed(context, '/kyc'),
            tooltip: 'KYC',
          ),
          IconButton(
            icon: const Icon(Icons.security),
            onPressed: () => Navigator.pushNamed(context, '/security'),
            tooltip: 'Security',
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Profile Image
              CircleAvatar(
                radius: 60,
                backgroundColor: Colors.grey.shade300,
                child: Align(
                  alignment: Alignment.bottomRight,
                  child: IconButton(
                    icon: const Icon(Icons.edit, color: Colors.white),
                    onPressed: () {
                      // TODO: Add image picker
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Fields
              TextFormField(
                controller: nameController,
                decoration: const InputDecoration(labelText: "Full Name"),
                validator: (value) =>
                    value == null || value.isEmpty ? "Enter your name" : null,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: mobileController,
                decoration: const InputDecoration(labelText: "Mobile Number"),
                keyboardType: TextInputType.phone,
                validator: (value) =>
                    value == null || value.isEmpty ? "Enter mobile number" : null,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: emailController,
                decoration: const InputDecoration(labelText: "Email"),
                keyboardType: TextInputType.emailAddress,
                validator: (value) =>
                    value == null || !value.contains("@") ? "Enter valid email" : null,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: addressController,
                decoration: const InputDecoration(labelText: "Address"),
                validator: (value) =>
                    value == null || value.isEmpty ? "Enter address" : null,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: pincodeController,
                decoration: const InputDecoration(labelText: "Postal Code"),
                keyboardType: TextInputType.number,
                validator: (value) =>
                    value == null || value.isEmpty ? "Enter postal code" : null,
              ),
              const SizedBox(height: 20),

              // Absa account number
              TextFormField(
                controller: absaAccountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: "Absa Account Number",
                  helperText: "Used for loan settlement",
                  prefixIcon: const Icon(Icons.account_balance),
                  suffixIcon: IconButton(
                    onPressed: () => setState(() => _maskAbsa = !_maskAbsa),
                    icon: Icon(_maskAbsa ? Icons.visibility : Icons.visibility_off),
                  ),
                ),
                obscureText: _maskAbsa,
                validator: (value) {
                  final v = (value ?? '').trim();
                  if (v.isEmpty) return null; // optional
                  if (v.length < 8 || v.length > 20) return "Enter a valid account number";
                  if (!RegExp(r'^\d+$').hasMatch(v)) return "Digits only";
                  return null;
                },
              ),
              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _updateProfile,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text(
                  "Update Profile",
                  style: TextStyle(fontSize: 18),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
