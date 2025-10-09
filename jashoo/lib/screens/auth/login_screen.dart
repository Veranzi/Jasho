import 'package:flutter/material.dart';
import 'signup_screen.dart'; // This navigates to your signup screen
import 'package:intl_phone_field/intl_phone_field.dart';
import '../../services/api_service.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final mobileController = TextEditingController();
  final passwordController = TextEditingController();
  final emailController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _rememberMe = false;
  String? _fullPhoneE164;
  bool _useEmailLogin = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 16),
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Illustration at the top
                Center(
                  child: Image.asset(
                    'assets/login.png', // your SVG/PNG illustration
                    height: 180,
                  ),
                ),
                const SizedBox(height: 30),

                // 2. Title
                Text(
                  "Login",
                  style: TextStyle(
                    fontSize: 30.sp,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                  textAlign: TextAlign.left,
                ),
                const SizedBox(height: 25),

                // 3. Identifier (email or phone)
                if (_useEmailLogin)
                  TextFormField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  )
                else
                  IntlPhoneField(
                    controller: mobileController,
                    decoration: InputDecoration(
                      labelText: 'Phone Number',
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    initialCountryCode: 'KE',
                    onChanged: (phone) {
                      final rawDigits = phone.number.replaceAll(RegExp(r'[^0-9]'), '');
                      final withoutTrunkZero = rawDigits.startsWith('0')
                          ? rawDigits.substring(1)
                          : rawDigits;
                      _fullPhoneE164 = '${phone.countryCode}$withoutTrunkZero';
                    },
                  ),
                const SizedBox(height: 15),

                // 4. Password
                TextFormField(
                  controller: passwordController,
                  obscureText: !_isPasswordVisible,
                  decoration: InputDecoration(
                    hintText: "Enter your password",
                    prefixIcon: const Icon(Icons.lock_outline,
                        color: Color(0xFF10B981)),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isPasswordVisible
                            ? Icons.visibility
                            : Icons.visibility_off,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _isPasswordVisible = !_isPasswordVisible;
                        });
                      },
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade100,
                    contentPadding: const EdgeInsets.symmetric(vertical: 18),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // 5. Remember + Forgot
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Checkbox(
                          value: _rememberMe,
                          onChanged: (bool? value) {
                            setState(() {
                              _rememberMe = value ?? false;
                            });
                          },
                          activeColor: const Color(0xFF10B981),
                        ),
                        const Text("Remember me"),
                      ],
                    ),
                    Row(children: [
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _useEmailLogin = !_useEmailLogin;
                          });
                        },
                        child: Text(
                          _useEmailLogin ? 'Use phone instead' : 'Use email instead',
                          style: const TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pushNamed(context, '/forgotPassword');
                        },
                        child: const Text(
                          "Forgot password?",
                          style: TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ]),
                  ],
                ),
                const SizedBox(height: 20),

                // 6. Login button
                ElevatedButton(
                onPressed: () async {
                    final password = passwordController.text;
                    try {
                      if (!_useEmailLogin && (_fullPhoneE164 == null || _fullPhoneE164!.isEmpty)) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a valid phone number')),
                        );
                        return;
                      }
                      // Auto-detect email vs phone regardless of toggle
                      final String identifier = _useEmailLogin
                          ? emailController.text.trim()
                          : (_fullPhoneE164 ?? mobileController.text.trim());
                      final bool isEmail = identifier.contains('@');
                      final resp = isEmail
                          ? await ApiService().login(
                              email: identifier,
                              password: password,
                            )
                          : await ApiService().loginWithPhone(
                              phoneNumber: identifier,
                              password: password,
                              rememberMe: _rememberMe,
                            );
                      if (resp['success'] == true) {
                        if (!mounted) return;
                        Navigator.pushReplacementNamed(context, '/dashboard');
                      } else {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(resp['message'] ?? 'Login failed')),
                        );
                      }
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                  child: Text(
                    "Login",
                    style: TextStyle(fontSize: 18.sp, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 18),

                // 7. Divider
                Row(
                  children: const [
                    Expanded(child: Divider(thickness: 1)),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8.0),
                      child: Text("or"),
                    ),
                    Expanded(child: Divider(thickness: 1)),
                  ],
                ),
                const SizedBox(height: 18),

                // 8. Sign Up
                OutlinedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const SignupScreen()),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: Color(0xFF10B981)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    "Create Account",
                    style: TextStyle(
                        fontSize: 18.sp, color: const Color(0xFF10B981)),
                  ),
                ),
                const SizedBox(height: 10),
                // Login with Phone and Google in same row
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pushNamed(context, '/phoneAuth');
                        },
                        icon: const Icon(Icons.sms),
                        label: const Text('Phone'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          // stub Google login
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Google Sign-In (stub)')),
                          );
                          Navigator.pushReplacementNamed(context, '/dashboard');
                        },
                        icon: const Icon(Icons.account_circle),
                        label: const Text('Google'),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
