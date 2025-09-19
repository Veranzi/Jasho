import 'package:flutter/foundation.dart';

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
  });
}

class UserProvider extends ChangeNotifier {
  UserProfile? _profile;

  UserProfile? get profile => _profile;
  bool get isKycComplete => _profile?.idNumber != null && _profile?.photoUrl != null;

  void loadDummyProfile() {
    _profile = UserProfile(
      userId: 'demo-user-1',
      fullName: 'John Doe',
      skills: ['Boda Rider', 'Mama Fua'],
      location: 'Nairobi, Westlands',
      rating: 4.6,
      isVerified: false,
    );
    notifyListeners();
  }

  void updateProfile(UserProfile updated) {
    _profile = updated;
    notifyListeners();
  }

  void completeKyc({required String idType, required String idNumber, String? photoUrl}) {
    if (_profile == null) return;
    _profile = UserProfile(
      userId: _profile!.userId,
      fullName: _profile!.fullName,
      skills: _profile!.skills,
      location: _profile!.location,
      rating: _profile!.rating,
      isVerified: true,
      idType: idType,
      idNumber: idNumber,
      photoUrl: photoUrl ?? _profile!.photoUrl,
    );
    notifyListeners();
  }
}

