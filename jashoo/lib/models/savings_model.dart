import 'package:json_annotation/json_annotation.dart';

part 'savings_model.g.dart';

@JsonSerializable()
class SavingsAccount {
  final String id;
  final String userId;
  final String name;
  final SavingsType type;
  final double balance;
  final String currency;
  final double interestRate;
  final DateTime createdAt;
  final DateTime? maturityDate;
  final SavingsStatus status;
  final bool isAutoSave;
  final double? autoSaveAmount;
  final String? autoSaveFrequency;
  final List<SavingsGoal> goals;
  final Map<String, dynamic> metadata;

  SavingsAccount({
    required this.id,
    required this.userId,
    required this.name,
    required this.type,
    required this.balance,
    this.currency = 'KES',
    required this.interestRate,
    required this.createdAt,
    this.maturityDate,
    required this.status,
    this.isAutoSave = false,
    this.autoSaveAmount,
    this.autoSaveFrequency,
    this.goals = const [],
    this.metadata = const {},
  });

  factory SavingsAccount.fromJson(Map<String, dynamic> json) => _$SavingsAccountFromJson(json);
  Map<String, dynamic> toJson() => _$SavingsAccountToJson(this);
}

enum SavingsType {
  @JsonValue('regular')
  regular,
  @JsonValue('fixed_deposit')
  fixedDeposit,
  @JsonValue('emergency')
  emergency,
  @JsonValue('goal_based')
  goalBased,
  @JsonValue('retirement')
  retirement,
  @JsonValue('education')
  education,
}

enum SavingsStatus {
  @JsonValue('active')
  active,
  @JsonValue('paused')
  paused,
  @JsonValue('matured')
  matured,
  @JsonValue('closed')
  closed,
  @JsonValue('suspended')
  suspended,
}

@JsonSerializable()
class SavingsGoal {
  final String id;
  final String accountId;
  final String name;
  final String description;
  final double targetAmount;
  final double currentAmount;
  final DateTime targetDate;
  final DateTime createdAt;
  final GoalStatus status;
  final String? imageUrl;
  final List<SavingsContribution> contributions;
  final Map<String, dynamic> metadata;

  SavingsGoal({
    required this.id,
    required this.accountId,
    required this.name,
    required this.description,
    required this.targetAmount,
    required this.currentAmount,
    required this.targetDate,
    required this.createdAt,
    required this.status,
    this.imageUrl,
    this.contributions = const [],
    this.metadata = const {},
  });

  factory SavingsGoal.fromJson(Map<String, dynamic> json) => _$SavingsGoalFromJson(json);
  Map<String, dynamic> toJson() => _$SavingsGoalToJson(this);
}

enum GoalStatus {
  @JsonValue('active')
  active,
  @JsonValue('completed')
  completed,
  @JsonValue('paused')
  paused,
  @JsonValue('cancelled')
  cancelled,
}

@JsonSerializable()
class SavingsContribution {
  final String id;
  final String goalId;
  final double amount;
  final DateTime date;
  final String source;
  final String? description;
  final ContributionType type;
  final Map<String, dynamic> metadata;

  SavingsContribution({
    required this.id,
    required this.goalId,
    required this.amount,
    required this.date,
    required this.source,
    this.description,
    required this.type,
    this.metadata = const {},
  });

  factory SavingsContribution.fromJson(Map<String, dynamic> json) => _$SavingsContributionFromJson(json);
  Map<String, dynamic> toJson() => _$SavingsContributionToJson(this);
}

enum ContributionType {
  @JsonValue('manual')
  manual,
  @JsonValue('auto_save')
  autoSave,
  @JsonValue('round_up')
  roundUp,
  @JsonValue('bonus')
  bonus,
  @JsonValue('interest')
  interest,
  @JsonValue('transfer')
  transfer,
}
