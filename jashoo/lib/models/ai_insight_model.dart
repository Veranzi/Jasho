import 'package:json_annotation/json_annotation.dart';

part 'ai_insight_model.g.dart';

@JsonSerializable()
class AIInsightModel {
  final String id;
  final String userId;
  final InsightType type;
  final String title;
  final String description;
  final String category;
  final double confidence;
  final DateTime generatedAt;
  final DateTime validUntil;
  final Map<String, dynamic> data;
  final List<String> recommendations;
  final List<String> actions;
  final Priority priority;
  final bool isRead;
  final bool isActioned;
  final Map<String, dynamic> metadata;

  AIInsightModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.description,
    required this.category,
    required this.confidence,
    required this.generatedAt,
    required this.validUntil,
    this.data = const {},
    this.recommendations = const [],
    this.actions = const [],
    required this.priority,
    this.isRead = false,
    this.isActioned = false,
    this.metadata = const {},
  });

  factory AIInsightModel.fromJson(Map<String, dynamic> json) => _$AIInsightModelFromJson(json);
  Map<String, dynamic> toJson() => _$AIInsightModelToJson(this);
}

enum InsightType {
  @JsonValue('income_forecast')
  incomeForecast,
  @JsonValue('expense_pattern')
  expensePattern,
  @JsonValue('savings_opportunity')
  savingsOpportunity,
  @JsonValue('credit_improvement')
  creditImprovement,
  @JsonValue('fraud_alert')
  fraudAlert,
  @JsonValue('job_recommendation')
  jobRecommendation,
  @JsonValue('financial_goal')
  financialGoal,
  @JsonValue('risk_assessment')
  riskAssessment,
  @JsonValue('opportunity_alert')
  opportunityAlert,
  @JsonValue('behavioral_insight')
  behavioralInsight,
}

enum Priority {
  @JsonValue('low')
  low,
  @JsonValue('medium')
  medium,
  @JsonValue('high')
  high,
  @JsonValue('urgent')
  urgent,
}

@JsonSerializable()
class IncomeForecast {
  final String id;
  final String userId;
  final DateTime forecastDate;
  final List<ForecastPeriod> periods;
  final double totalProjectedIncome;
  final double confidence;
  final List<String> factors;
  final Map<String, dynamic> seasonalData;
  final List<String> recommendations;

  IncomeForecast({
    required this.id,
    required this.userId,
    required this.forecastDate,
    required this.periods,
    required this.totalProjectedIncome,
    required this.confidence,
    this.factors = const [],
    this.seasonalData = const {},
    this.recommendations = const [],
  });

  factory IncomeForecast.fromJson(Map<String, dynamic> json) => _$IncomeForecastFromJson(json);
  Map<String, dynamic> toJson() => _$IncomeForecastToJson(this);
}

@JsonSerializable()
class ForecastPeriod {
  final DateTime startDate;
  final DateTime endDate;
  final double projectedIncome;
  final double minIncome;
  final double maxIncome;
  final double confidence;
  final List<String> gigTypes;
  final Map<String, dynamic> factors;

  ForecastPeriod({
    required this.startDate,
    required this.endDate,
    required this.projectedIncome,
    required this.minIncome,
    required this.maxIncome,
    required this.confidence,
    this.gigTypes = const [],
    this.factors = const {},
  });

  factory ForecastPeriod.fromJson(Map<String, dynamic> json) => _$ForecastPeriodFromJson(json);
  Map<String, dynamic> toJson() => _$ForecastPeriodToJson(this);
}

@JsonSerializable()
class FraudDetection {
  final String id;
  final String userId;
  final String transactionId;
  final FraudType type;
  final double riskScore;
  final String description;
  final List<String> indicators;
  final DateTime detectedAt;
  final FraudStatus status;
  final String? resolution;
  final DateTime? resolvedAt;
  final Map<String, dynamic> metadata;

  FraudDetection({
    required this.id,
    required this.userId,
    required this.transactionId,
    required this.type,
    required this.riskScore,
    required this.description,
    this.indicators = const [],
    required this.detectedAt,
    required this.status,
    this.resolution,
    this.resolvedAt,
    this.metadata = const {},
  });

  factory FraudDetection.fromJson(Map<String, dynamic> json) => _$FraudDetectionFromJson(json);
  Map<String, dynamic> toJson() => _$FraudDetectionToJson(this);
}

enum FraudType {
  @JsonValue('suspicious_transaction')
  suspiciousTransaction,
  @JsonValue('fake_job')
  fakeJob,
  @JsonValue('phishing_attempt')
  phishingAttempt,
  @JsonValue('identity_theft')
  identityTheft,
  @JsonValue('money_laundering')
  moneyLaundering,
  @JsonValue('scam_detection')
  scamDetection,
  @JsonValue('unusual_pattern')
  unusualPattern,
}

enum FraudStatus {
  @JsonValue('detected')
  detected,
  @JsonValue('investigating')
  investigating,
  @JsonValue('confirmed')
  confirmed,
  @JsonValue('false_positive')
  falsePositive,
  @JsonValue('resolved')
  resolved,
}
