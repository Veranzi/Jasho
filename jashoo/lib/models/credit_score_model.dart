import 'package:json_annotation/json_annotation.dart';

part 'credit_score_model.g.dart';

@JsonSerializable()
class CreditScoreModel {
  final String id;
  final String userId;
  final int score;
  final CreditRating rating;
  final List<CreditFactor> factors;
  final DateTime calculatedAt;
  final DateTime validUntil;
  final Map<String, dynamic> aiInsights;
  final List<String> recommendations;
  final double confidence;
  final String modelVersion;
  final Map<String, dynamic> rawData;

  CreditScoreModel({
    required this.id,
    required this.userId,
    required this.score,
    required this.rating,
    required this.factors,
    required this.calculatedAt,
    required this.validUntil,
    this.aiInsights = const {},
    this.recommendations = const [],
    required this.confidence,
    required this.modelVersion,
    this.rawData = const {},
  });

  factory CreditScoreModel.fromJson(Map<String, dynamic> json) => _$CreditScoreModelFromJson(json);
  Map<String, dynamic> toJson() => _$CreditScoreModelToJson(this);
}

@JsonSerializable()
class CreditFactor {
  final String name;
  final String description;
  final double weight;
  final double score;
  final String impact;
  final List<String> suggestions;
  final Map<String, dynamic> details;

  CreditFactor({
    required this.name,
    required this.description,
    required this.weight,
    required this.score,
    required this.impact,
    this.suggestions = const [],
    this.details = const {},
  });

  factory CreditFactor.fromJson(Map<String, dynamic> json) => _$CreditFactorFromJson(json);
  Map<String, dynamic> toJson() => _$CreditFactorToJson(this);
}

enum CreditRating {
  @JsonValue('excellent')
  excellent,
  @JsonValue('good')
  good,
  @JsonValue('fair')
  fair,
  @JsonValue('poor')
  poor,
  @JsonValue('very_poor')
  veryPoor,
}

@JsonSerializable()
class CreditHistory {
  final String id;
  final String userId;
  final List<CreditEvent> events;
  final DateTime startDate;
  final DateTime endDate;
  final double totalBorrowed;
  final double totalRepaid;
  final double totalOutstanding;
  final int onTimePayments;
  final int latePayments;
  final int missedPayments;
  final double averagePaymentTime;
  final Map<String, dynamic> patterns;

  CreditHistory({
    required this.id,
    required this.userId,
    required this.events,
    required this.startDate,
    required this.endDate,
    required this.totalBorrowed,
    required this.totalRepaid,
    required this.totalOutstanding,
    required this.onTimePayments,
    required this.latePayments,
    required this.missedPayments,
    required this.averagePaymentTime,
    this.patterns = const {},
  });

  factory CreditHistory.fromJson(Map<String, dynamic> json) => _$CreditHistoryFromJson(json);
  Map<String, dynamic> toJson() => _$CreditHistoryToJson(this);
}

@JsonSerializable()
class CreditEvent {
  final String id;
  final String type;
  final double amount;
  final DateTime date;
  final String status;
  final String? description;
  final String? lenderId;
  final Map<String, dynamic> metadata;

  CreditEvent({
    required this.id,
    required this.type,
    required this.amount,
    required this.date,
    required this.status,
    this.description,
    this.lenderId,
    this.metadata = const {},
  });

  factory CreditEvent.fromJson(Map<String, dynamic> json) => _$CreditEventFromJson(json);
  Map<String, dynamic> toJson() => _$CreditEventToJson(this);
}
