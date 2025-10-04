import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class UserProfile {
  final String userId;
  String fullName;
  List<String> skills;
  String location; // e.g., "Nairobi, Westlands"
  double rating; // 0-5
  bool isVerified;
  String? idType; // ID/Passport
  String? idNumber;
  String? photoUrl;
  String? absaAccountNumber; // Optional linked Absa settlement account
  String? email;
  String? phoneNumber;
  String? verificationLevel;
  DateTime? joinDate;
  int? totalJobsCompleted;
  double? totalEarnings;
  double? totalSavings;
  double? totalWithdrawals;
  int? profileViews;
  bool? isKycComplete;

  UserProfile({
    required this.userId,
    required this.fullName,
    required this.skills,
    required this.location,
    required this.rating,
    required this.isVerified,
    this.idType,
    this.idNumber,
    this.photoUrl,
    this.absaAccountNumber,
    this.email,
    this.phoneNumber,
    this.verificationLevel,
    this.joinDate,
    this.totalJobsCompleted,
    this.totalEarnings,
    this.totalSavings,
    this.totalWithdrawals,
    this.profileViews,
    this.isKycComplete,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      userId: json['userId'],
      fullName: json['fullName'],
      skills: List<String>.from(json['skills'] ?? []),
      location: json['location'],
      rating: (json['rating'] ?? 0).toDouble(),
      isVerified: json['isVerified'] ?? false,
      idType: json['idType'],
      idNumber: json['idNumber'],
      photoUrl: json['photoUrl'],
      absaAccountNumber: json['absaAccountNumber'],
      email: json['email'],
      phoneNumber: json['phoneNumber'],
      verificationLevel: json['verificationLevel'],
      joinDate: json['joinDate'] != null ? DateTime.parse(json['joinDate']) : null,
      totalJobsCompleted: json['totalJobsCompleted'],
      totalEarnings: json['totalEarnings']?.toDouble(),
      totalSavings: json['totalSavings']?.toDouble(),
      totalWithdrawals: json['totalWithdrawals']?.toDouble(),
      profileViews: json['profileViews'],
      isKycComplete: json['isKycComplete'],
    );
  }
}

class UserProvider extends ChangeNotifier {
  UserProfile? _profile;
  bool _isLoading = false;
  String? _error;

  UserProfile? get profile => _profile;
  bool get isKycComplete => _profile?.isKycComplete ?? false;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Load user profile from API
  Future<void> loadProfile() async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().getUserProfile();
      
      if (response['success'] == true) {
        final profileData = response['data']['profile'];
        _profile = UserProfile.fromJson(profileData);
        notifyListeners();
      } else {
        _setError(response['message'] ?? 'Failed to load profile');
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  // Update user profile
  Future<bool> updateProfile({
    String? fullName,
    List<String>? skills,
    String? location,
    Map<String, double>? coordinates,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().updateUserProfile(
        fullName: fullName,
        skills: skills,
        location: location,
        coordinates: coordinates,
      );
      
      if (response['success'] == true) {
        final profileData = response['data']['profile'];
        _profile = UserProfile.fromJson(profileData);
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to update profile');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Complete KYC
  Future<bool> completeKyc({
    required String idType,
    required String idNumber,
    String? photoUrl,
    List<String>? documentUrls,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().completeKyc(
        idType: idType,
        idNumber: idNumber,
        photoUrl: photoUrl,
        documentUrls: documentUrls,
      );
      
      if (response['success'] == true) {
        final profileData = response['data']['profile'];
        _profile = UserProfile.fromJson(profileData);
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to complete KYC');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Link Absa account
  Future<bool> linkAbsaAccount({required String accountNumber}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().linkAbsaAccount(accountNumber: accountNumber);
      
      if (response['success'] == true) {
        final profileData = response['data']['profile'];
        _profile = UserProfile.fromJson(profileData);
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to link Absa account');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update language preference
  Future<bool> updateLanguage({required String language}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().updateLanguage(language: language);
      
      if (response['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to update language');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update notification preferences
  Future<bool> updateNotifications({
    bool? email,
    bool? sms,
    bool? push,
    bool? marketing,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().updateNotifications(
        email: email,
        sms: sms,
        push: push,
        marketing: marketing,
      );
      
      if (response['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _setError(response['message'] ?? 'Failed to update notifications');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get public profile of another user
  Future<UserProfile?> getPublicProfile({required String userId}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await ApiService().getPublicProfile(userId: userId);
      
      if (response['success'] == true) {
        final profileData = response['data']['profile'];
        return UserProfile.fromJson(profileData);
      } else {
        _setError(response['message'] ?? 'Failed to get user profile');
        return null;
      }
    } catch (e) {
      _setError(e.toString());
      return null;
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

  // Legacy method for backward compatibility
  void loadDummyProfile() {
    _profile = UserProfile(
      userId: 'demo-user-1',
      fullName: 'John Doe',
      skills: ['Boda Rider', 'Mama Fua'],
      location: 'Nairobi, Westlands',
      rating: 4.6,
      isVerified: false,
      absaAccountNumber: '123456789012',
    );
    notifyListeners();
  }
}