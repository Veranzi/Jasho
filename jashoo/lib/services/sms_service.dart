import 'dart:convert';
import 'package:http/http.dart' as http;

class SMSService {
  static final SMSService _instance = SMSService._internal();
  factory SMSService() => _instance;
  SMSService._internal();

  final String _apiKey = 'YOUR_SMS_API_KEY';
  final String _apiUrl = 'https://api.sms.ke';

  // Send SMS
  Future<bool> sendSMS({
    required String phoneNumber,
    required String message,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_apiUrl/send'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_apiKey',
        },
        body: jsonEncode({
          'to': phoneNumber,
          'message': message,
          'from': 'HustleOS',
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Send OTP
  Future<bool> sendOTP(String phoneNumber) async {
    final otp = _generateOTP();
    final message = 'Your HustleOS verification code is: $otp. Valid for 5 minutes.';
    
    final success = await sendSMS(
      phoneNumber: phoneNumber,
      message: message,
    );

    if (success) {
      // Store OTP for verification
      await _storeOTP(phoneNumber, otp);
    }

    return success;
  }

  // Verify OTP
  Future<bool> verifyOTP(String phoneNumber, String otp) async {
    final storedOTP = await _getStoredOTP(phoneNumber);
    return storedOTP == otp;
  }

  // Generate 6-digit OTP
  String _generateOTP() {
    final random = DateTime.now().millisecondsSinceEpoch;
    return (random % 1000000).toString().padLeft(6, '0');
  }

  // Store OTP (in production, use secure storage)
  Future<void> _storeOTP(String phoneNumber, String otp) async {
    // Implementation depends on your storage solution
    // For now, using a simple in-memory storage
    _otpStorage[phoneNumber] = {
      'otp': otp,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
  }

  // Get stored OTP
  Future<String?> _getStoredOTP(String phoneNumber) async {
    final stored = _otpStorage[phoneNumber];
    if (stored == null) return null;

    // Check if OTP is expired (5 minutes)
    final now = DateTime.now().millisecondsSinceEpoch;
    final storedTime = stored['timestamp'] as int;
    if (now - storedTime > 300000) { // 5 minutes
      _otpStorage.remove(phoneNumber);
      return null;
    }

    return stored['otp'] as String;
  }

  // In-memory storage for OTPs (replace with secure storage in production)
  final Map<String, Map<String, dynamic>> _otpStorage = {};
}
