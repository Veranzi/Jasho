import 'package:json_annotation/json_annotation.dart';

part 'insurance_model.g.dart';

@JsonSerializable()
class InsurancePolicy {
  final String id;
  final String userId;
  final String providerId;
  final String providerName;
  final InsuranceType type;
  final String name;
  final String description;
  final double premium;
  final String premiumFrequency;
  final double coverage;
  final String currency;
  final DateTime startDate;
  final DateTime endDate;
  final PolicyStatus status;
  final String policyNumber;
  final List<CoverageItem> coverageItems;
  final Map<String, dynamic> terms;
  final List<Claim> claims;
  final Map<String, dynamic> metadata;

  InsurancePolicy({
    required this.id,
    required this.userId,
    required this.providerId,
    required this.providerName,
    required this.type,
    required this.name,
    required this.description,
    required this.premium,
    required this.premiumFrequency,
    required this.coverage,
    this.currency = 'KES',
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.policyNumber,
    this.coverageItems = const [],
    this.terms = const {},
    this.claims = const [],
    this.metadata = const {},
  });

  factory InsurancePolicy.fromJson(Map<String, dynamic> json) => _$InsurancePolicyFromJson(json);
  Map<String, dynamic> toJson() => _$InsurancePolicyToJson(this);
}

enum InsuranceType {
  @JsonValue('health')
  health,
  @JsonValue('accident')
  accident,
  @JsonValue('income_protection')
  incomeProtection,
  @JsonValue('vehicle')
  vehicle,
  @JsonValue('property')
  property,
  @JsonValue('life')
  life,
  @JsonValue('disability')
  disability,
  @JsonValue('travel')
  travel,
}

enum PolicyStatus {
  @JsonValue('active')
  active,
  @JsonValue('inactive')
  inactive,
  @JsonValue('expired')
  expired,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('suspended')
  suspended,
  @JsonValue('pending')
  pending,
}

@JsonSerializable()
class CoverageItem {
  final String id;
  final String name;
  final String description;
  final double coverageAmount;
  final double deductible;
  final String currency;
  final Map<String, dynamic> conditions;

  CoverageItem({
    required this.id,
    required this.name,
    required this.description,
    required this.coverageAmount,
    required this.deductible,
    this.currency = 'KES',
    this.conditions = const {},
  });

  factory CoverageItem.fromJson(Map<String, dynamic> json) => _$CoverageItemFromJson(json);
  Map<String, dynamic> toJson() => _$CoverageItemToJson(this);
}

@JsonSerializable()
class Claim {
  final String id;
  final String policyId;
  final ClaimType type;
  final String description;
  final double amount;
  final String currency;
  final DateTime incidentDate;
  final DateTime filedDate;
  final ClaimStatus status;
  final String? statusReason;
  final List<String> documents;
  final List<String> images;
  final String? adjusterNotes;
  final double? approvedAmount;
  final DateTime? processedDate;
  final Map<String, dynamic> metadata;

  Claim({
    required this.id,
    required this.policyId,
    required this.type,
    required this.description,
    required this.amount,
    this.currency = 'KES',
    required this.incidentDate,
    required this.filedDate,
    required this.status,
    this.statusReason,
    this.documents = const [],
    this.images = const [],
    this.adjusterNotes,
    this.approvedAmount,
    this.processedDate,
    this.metadata = const {},
  });

  factory Claim.fromJson(Map<String, dynamic> json) => _$ClaimFromJson(json);
  Map<String, dynamic> toJson() => _$ClaimToJson(this);
}

enum ClaimType {
  @JsonValue('medical')
  medical,
  @JsonValue('accident')
  accident,
  @JsonValue('property_damage')
  propertyDamage,
  @JsonValue('income_loss')
  incomeLoss,
  @JsonValue('vehicle_damage')
  vehicleDamage,
  @JsonValue('theft')
  theft,
  @JsonValue('other')
  other,
}

enum ClaimStatus {
  @JsonValue('filed')
  filed,
  @JsonValue('under_review')
  underReview,
  @JsonValue('approved')
  approved,
  @JsonValue('rejected')
  rejected,
  @JsonValue('paid')
  paid,
  @JsonValue('cancelled')
  cancelled,
}
