import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final String id;
  final String phoneNumber;
  final String? email;
  final String firstName;
  final String lastName;
  final String? profileImageUrl;
  final DateTime dateOfBirth;
  final String nationalId;
  final String? mpesaNumber;
  final UserProfile profile;
  final UserPreferences preferences;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isVerified;
  final bool isActive;
  final List<String> gigTypes;
  final String? referralCode;
  final String? referredBy;

  UserModel({
    required this.id,
    required this.phoneNumber,
    this.email,
    required this.firstName,
    required this.lastName,
    this.profileImageUrl,
    required this.dateOfBirth,
    required this.nationalId,
    this.mpesaNumber,
    required this.profile,
    required this.preferences,
    required this.createdAt,
    required this.updatedAt,
    this.isVerified = false,
    this.isActive = true,
    this.gigTypes = const [],
    this.referralCode,
    this.referredBy,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  UserModel copyWith({
    String? id,
    String? phoneNumber,
    String? email,
    String? firstName,
    String? lastName,
    String? profileImageUrl,
    DateTime? dateOfBirth,
    String? nationalId,
    String? mpesaNumber,
    UserProfile? profile,
    UserPreferences? preferences,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isVerified,
    bool? isActive,
    List<String>? gigTypes,
    String? referralCode,
    String? referredBy,
  }) {
    return UserModel(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      nationalId: nationalId ?? this.nationalId,
      mpesaNumber: mpesaNumber ?? this.mpesaNumber,
      profile: profile ?? this.profile,
      preferences: preferences ?? this.preferences,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isVerified: isVerified ?? this.isVerified,
      isActive: isActive ?? this.isActive,
      gigTypes: gigTypes ?? this.gigTypes,
      referralCode: referralCode ?? this.referralCode,
      referredBy: referredBy ?? this.referredBy,
    );
  }
}

@JsonSerializable()
class UserProfile {
  final String occupation;
  final List<String> skills;
  final String experienceLevel;
  final String educationLevel;
  final String location;
  final double latitude;
  final double longitude;
  final String bio;
  final List<String> languages;
  final bool hasVehicle;
  final String? vehicleType;
  final String? vehicleRegistration;
  final Map<String, dynamic> additionalInfo;

  UserProfile({
    required this.occupation,
    this.skills = const [],
    required this.experienceLevel,
    required this.educationLevel,
    required this.location,
    required this.latitude,
    required this.longitude,
    this.bio = '',
    this.languages = const ['English'],
    this.hasVehicle = false,
    this.vehicleType,
    this.vehicleRegistration,
    this.additionalInfo = const {},
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => _$UserProfileFromJson(json);
  Map<String, dynamic> toJson() => _$UserProfileToJson(this);
}

@JsonSerializable()
class UserPreferences {
  final bool notificationsEnabled;
  final bool biometricEnabled;
  final bool dataSharingEnabled;
  final String currency;
  final String language;
  final bool darkMode;
  final Map<String, dynamic> privacySettings;
  final List<String> preferredGigTypes;
  final int maxDistanceKm;
  final bool autoSaveEnabled;
  final double autoSavePercentage;

  UserPreferences({
    this.notificationsEnabled = true,
    this.biometricEnabled = false,
    this.dataSharingEnabled = true,
    this.currency = 'KES',
    this.language = 'en',
    this.darkMode = false,
    this.privacySettings = const {},
    this.preferredGigTypes = const [],
    this.maxDistanceKm = 50,
    this.autoSaveEnabled = false,
    this.autoSavePercentage = 10.0,
  });

  factory UserPreferences.fromJson(Map<String, dynamic> json) => _$UserPreferencesFromJson(json);
  Map<String, dynamic> toJson() => _$UserPreferencesToJson(this);
}
