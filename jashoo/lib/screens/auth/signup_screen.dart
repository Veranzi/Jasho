import 'package:flutter/material.dart';
import 'package:intl_phone_field/intl_phone_field.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  // Controllers
  final usernameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  String? _fullPhoneE164;

  // State vars
  List<String> selectedHustles = [];
  String? selectedCountry;
  String? selectedCounty;
  String? selectedWard;

  final _formKey = GlobalKey<FormState>();

  // Hustles list
  final List<String> hustles = [
    "Mama Mboga",
    "Boda Rider",
    "Mama Fua",
    "Online Writer",
    "Retailer",
    "Chemist",
    "Wholesaler",
    "Farmer",
    "Artisan",
    "Mechanic",
    "Tailor",
    "Hairdresser",
  ];

  // Country -> Counties/Provinces
  final Map<String, List<String>> countryRegions = {
    "Kenya": ["Nairobi", "Kiambu", "Mombasa", "Kisumu", "Nakuru", "Machakos"],
    "South Africa": ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"],
  };

  // County/Province -> Wards/Areas
  final Map<String, List<String>> wards = {
    // Kenya
    "Nairobi": ["Westlands", "Langata", "Kasarani"],
    "Kiambu": ["Thika Town", "Ruiru", "Gatundu"],
    "Mombasa": ["Mvita", "Kisauni", "Nyali"],
    "Kisumu": ["Kisumu East", "Kisumu West", "Nyando"],
    "Nakuru": ["Nakuru Town East", "Nakuru Town West"],
    "Machakos": ["Mavoko", "Machakos Town", "Kangundo"],

    // South Africa (example data)
    "Gauteng": ["Johannesburg", "Pretoria"],
    "Western Cape": ["Cape Town", "Stellenbosch"],
    "KwaZulu-Natal": ["Durban", "Pietermaritzburg"],
    "Eastern Cape": ["Port Elizabeth", "East London"],
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Image.asset(
                    'assets/signup.png',
                    height: 150,
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    "Sign Up",
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0D47A1),
                    ),
                  ),
                  const SizedBox(height: 30),

                  // Input fields
                  _buildTextField(usernameController, "Full Name", Icons.person_outline,
                      validator: (val) =>
                          val == null || val.isEmpty ? "Enter username" : null),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: IntlPhoneField(
                      controller: phoneController,
                      decoration: InputDecoration(
                        labelText: 'Phone Number',
                        border:
                            OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),
                      ),
                      initialCountryCode: selectedCountry == 'South Africa' ? 'ZA' : 'KE',
                      onChanged: (phone) {
                        _fullPhoneE164 = phone.completeNumber;
                      },
                      validator: (val) {
                        if (val == null || val.number.isEmpty) {
                          return 'Enter phone number';
                        }
                        return null;
                      },
                    ),
                  ),
                  _buildTextField(emailController, "Email", Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      validator: (val) {
                        if (val == null || val.isEmpty) return "Enter email";
                        if (!val.contains("@")) return "Enter valid email";
                        return null;
                      }),

                  // Hustles
                  _buildMultiSelectField("Your Hustles", hustles),

                  // Country
                  _buildDropdownField(
                    "Country",
                    countryRegions.keys.toList(),
                    selectedCountry,
                    (val) {
                      setState(() {
                        selectedCountry = val;
                        selectedCounty = null;
                        selectedWard = null;
                      });
                    },
                    Icons.flag_outlined,
                  ),

                  // County/Province
                  if (selectedCountry != null)
                    _buildDropdownField(
                        "County / Province",
                        countryRegions[selectedCountry] ?? [],
                        selectedCounty,
                        (val) {
                          setState(() {
                            selectedCounty = val;
                            selectedWard = null;
                          });
                        },
                        Icons.map_outlined),

                  // Ward
                  if (selectedCounty != null)
                    _buildDropdownField(
                        "Constituency / Ward",
                        wards[selectedCounty] ?? [],
                        selectedWard,
                        (val) => setState(() => selectedWard = val),
                        Icons.location_city_outlined),

                  _buildPasswordField(passwordController, "Password",
                      validator: (val) {
                    if (val == null || val.isEmpty) return "Enter password";
                    if (val.length < 8) return "Password too short";
                    return null;
                  }),
                  _buildPasswordField(confirmPasswordController, "Confirm Password",
                      validator: (val) {
                    if (val != passwordController.text) {
                      return "Passwords do not match";
                    }
                    return null;
                  }),
                  const SizedBox(height: 10),

                  const Text(
                    "Password must have: 1 uppercase, 1 lowercase, 1 number, and 1 special character. Length 8-16 characters.",
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 30),

                  ElevatedButton(
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        if (selectedHustles.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Please select at least one hustle")),
                          );
                          return;
                        }
                        if (_fullPhoneE164 == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Please enter a valid phone number")),
                          );
                          return;
                        }
                        if (selectedCountry == null ||
                            selectedCounty == null ||
                            selectedWard == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Please complete location details")),
                          );
                          return;
                        }

                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                                "Signup Successful! Hustles: ${selectedHustles.join(", ")}"),
                          ),
                        );

                        // TODO: Add Firebase or API signup here
                        Navigator.of(context).pop();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0D47A1),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8.0),
                      ),
                    ),
                    child: const Text(
                      "Register",
                      style: TextStyle(fontSize: 18, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 10),

                  Center(
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      child: const Text(
                        "Already have an account?",
                        style: TextStyle(
                            color: Color(0xFF00505D),
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Helpers ----------------
  Widget _buildTextField(TextEditingController controller, String label, IconData icon,
      {TextInputType keyboardType = TextInputType.text,
      String? Function(String?)? validator}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),
        ),
      ),
    );
  }

  Widget _buildPasswordField(TextEditingController controller, String label,
      {String? Function(String?)? validator}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: TextFormField(
        controller: controller,
        obscureText: true,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.lock_outline),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),
        ),
      ),
    );
  }

  Widget _buildDropdownField(String label, List<String> items, String? value,
      ValueChanged<String?> onChanged, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: DropdownButtonFormField<String>(
        initialValue: value,
        items: items.map((String item) {
          return DropdownMenuItem<String>(
            value: item,
            child: Text(item),
          );
        }).toList(),
        onChanged: onChanged,
        validator: (val) => val == null ? "Select $label" : null,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),
        ),
      ),
    );
  }

  Widget _buildMultiSelectField(String label, List<String> options) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          Wrap(
            spacing: 8.0,
            children: options.map((hustle) {
              final isSelected = selectedHustles.contains(hustle);
              return FilterChip(
                label: Text(hustle),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      selectedHustles.add(hustle);
                    } else {
                      selectedHustles.remove(hustle);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
