import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _userId;
  String? _token;
  String? _email;
  String? _fullName;
  bool _isLoading = false;
  String? _error;

  // Getters
  bool get isLoggedIn => _userId != null && _token != null;
  String? get userId => _userId;
  String? get token => _token;
  String? get email => _email;
  String? get fullName => _fullName;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Initialize with stored token
  Future<void> initialize() async {
    _setLoading(true);
    try {
      await ApiService().initialize();
      final token = ApiService().token;
      
      if (token != null) {
        // Verify token is still valid by getting user profile
        final response = await ApiService().getUserProfile();
        if (response['success'] == true) {
          final user = response['data']['profile'];
          _userId = user['userId'];
          _token = token;
          _email = user['email'];
          _fullName = user['fullName'];
        } else {
          // Token is invalid, clear it
          await ApiService().clearToken();
        }
      }
    } catch (e) {
      // Clear invalid token
      await ApiService().clearToken();
    } finally {
      _setLoading(false);
    }
  }

  // Register new user
  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
    required String location,
    List<String>? skills,
    String? dateOfBirth,
    String? gender,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().register(
        email: email,
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber,
        location: location,
        skills: skills,
        dateOfBirth: dateOfBirth,
        gender: gender,
      );
      
      if (response['success'] == true) {
        final data = response['data'];
        _userId = data['user']['userId'];
        _token = data['token'];
        _email = data['user']['email'];
        _fullName = data['user']['fullName'];
        
        // Store token
        await ApiService().setToken(_token!);
        
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Registration failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Login user
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().login(
        email: email,
        password: password,
      );
      
      if (response['success'] == true) {
        final data = response['data'];
        _userId = data['user']['userId'];
        _token = data['token'];
        _email = data['user']['email'];
        _fullName = data['user']['fullName'];
        
        // Token is already stored by ApiService
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Login failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Logout user
  Future<void> logout() async {
    _setLoading(true);
    
    try {
      await ApiService().logout();
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      _clearUserData();
      _setLoading(false);
    }
  }

  // Verify email
  Future<bool> verifyEmail({required String token}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().verifyEmail(token: token);
      
      if (response['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Email verification failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Verify phone
  Future<bool> verifyPhone({
    required String phoneNumber,
    required String code,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().verifyPhone(
        phoneNumber: phoneNumber,
        code: code,
      );
      
      if (response['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Phone verification failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Resend email verification
  Future<bool> resendEmailVerification() async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().resendEmailVerification();
      
      if (response['success'] == true) {
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to resend email verification');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Resend phone verification
  Future<bool> resendPhoneVerification() async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().resendPhoneVerification();
      
      if (response['success'] == true) {
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to resend phone verification');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Forgot password
  Future<bool> forgotPassword({required String email}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().forgotPassword(email: email);
      
      if (response['success'] == true) {
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to send password reset email');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Reset password
  Future<bool> resetPassword({
    required String token,
    required String password,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().resetPassword(
        token: token,
        password: password,
      );
      
      if (response['success'] == true) {
        return true;
      } else {
        _setError(response['message'] ?? 'Password reset failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      
      if (response['success'] == true) {
        return true;
      } else {
        _setError(response['message'] ?? 'Password change failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Private helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }

  void _clearUserData() {
    _userId = null;
    _token = null;
    _email = null;
    _fullName = null;
    _error = null;
    notifyListeners();
  }
}
