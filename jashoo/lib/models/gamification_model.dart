import 'package:json_annotation/json_annotation.dart';

part 'gamification_model.g.dart';

@JsonSerializable()
class UserProfile {
  final String id;
  final String userId;
  final int totalPoints;
  final int level;
  final String levelName;
  final int experience;
  final int experienceToNextLevel;
  final List<Badge> badges;
  final List<Achievement> achievements;
  final List<Streak> streaks;
  final Map<String, dynamic> statistics;
  final DateTime lastUpdated;

  UserProfile({
    required this.id,
    required this.userId,
    required this.totalPoints,
    required this.level,
    required this.levelName,
    required this.experience,
    required this.experienceToNextLevel,
    this.badges = const [],
    this.achievements = const [],
    this.streaks = const [],
    this.statistics = const {},
    required this.lastUpdated,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => _$UserProfileFromJson(json);
  Map<String, dynamic> toJson() => _$UserProfileToJson(this);
}

@JsonSerializable()
class Badge {
  final String id;
  final String name;
  final String description;
  final String iconUrl;
  final BadgeType type;
  final BadgeRarity rarity;
  final int points;
  final List<String> requirements;
  final DateTime earnedAt;
  final bool isActive;

  Badge({
    required this.id,
    required this.name,
    required this.description,
    required this.iconUrl,
    required this.type,
    required this.rarity,
    required this.points,
    this.requirements = const [],
    required this.earnedAt,
    this.isActive = true,
  });

  factory Badge.fromJson(Map<String, dynamic> json) => _$BadgeFromJson(json);
  Map<String, dynamic> toJson() => _$BadgeToJson(this);
}

enum BadgeType {
  @JsonValue('savings')
  savings,
  @JsonValue('income')
  income,
  @JsonValue('credit')
  credit,
  @JsonValue('consistency')
  consistency,
  @JsonValue('milestone')
  milestone,
  @JsonValue('social')
  social,
  @JsonValue('security')
  security,
  @JsonValue('learning')
  learning,
}

enum BadgeRarity {
  @JsonValue('common')
  common,
  @JsonValue('uncommon')
  uncommon,
  @JsonValue('rare')
  rare,
  @JsonValue('epic')
  epic,
  @JsonValue('legendary')
  legendary,
}

@JsonSerializable()
class Achievement {
  final String id;
  final String name;
  final String description;
  final AchievementType type;
  final int targetValue;
  final int currentValue;
  final bool isCompleted;
  final DateTime? completedAt;
  final List<Reward> rewards;
  final Map<String, dynamic> metadata;

  Achievement({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.targetValue,
    required this.currentValue,
    this.isCompleted = false,
    this.completedAt,
    this.rewards = const [],
    this.metadata = const {},
  });

  factory Achievement.fromJson(Map<String, dynamic> json) => _$AchievementFromJson(json);
  Map<String, dynamic> toJson() => _$AchievementToJson(this);
}

enum AchievementType {
  @JsonValue('savings_amount')
  savingsAmount,
  @JsonValue('savings_streak')
  savingsStreak,
  @JsonValue('income_goal')
  incomeGoal,
  @JsonValue('credit_score')
  creditScore,
  @JsonValue('transaction_count')
  transactionCount,
  @JsonValue('referral_count')
  referralCount,
  @JsonValue('app_usage')
  appUsage,
  @JsonValue('security_score')
  securityScore,
}

@JsonSerializable()
class Streak {
  final String id;
  final String userId;
  final StreakType type;
  final int currentStreak;
  final int longestStreak;
  final DateTime startDate;
  final DateTime? lastActivityDate;
  final bool isActive;
  final Map<String, dynamic> metadata;

  Streak({
    required this.id,
    required this.userId,
    required this.type,
    required this.currentStreak,
    required this.longestStreak,
    required this.startDate,
    this.lastActivityDate,
    this.isActive = true,
    this.metadata = const {},
  });

  factory Streak.fromJson(Map<String, dynamic> json) => _$StreakFromJson(json);
  Map<String, dynamic> toJson() => _$StreakToJson(this);
}

enum StreakType {
  @JsonValue('daily_savings')
  dailySavings,
  @JsonValue('weekly_income')
  weeklyIncome,
  @JsonValue('monthly_goals')
  monthlyGoals,
  @JsonValue('app_login')
  appLogin,
  @JsonValue('transaction_logging')
  transactionLogging,
}

@JsonSerializable()
class Reward {
  final String id;
  final String name;
  final String description;
  final RewardType type;
  final double value;
  final String currency;
  final DateTime earnedAt;
  final DateTime? expiresAt;
  final RewardStatus status;
  final String? redemptionCode;
  final Map<String, dynamic> metadata;

  Reward({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.value,
    this.currency = 'KES',
    required this.earnedAt,
    this.expiresAt,
    required this.status,
    this.redemptionCode,
    this.metadata = const {},
  });

  factory Reward.fromJson(Map<String, dynamic> json) => _$RewardFromJson(json);
  Map<String, dynamic> toJson() => _$RewardToJson(this);
}

enum RewardType {
  @JsonValue('airtime')
  airtime,
  @JsonValue('discount')
  discount,
  @JsonValue('cashback')
  cashback,
  @JsonValue('points')
  points,
  @JsonValue('voucher')
  voucher,
  @JsonValue('fee_reduction')
  feeReduction,
  @JsonValue('premium_feature')
  premiumFeature,
}

enum RewardStatus {
  @JsonValue('earned')
  earned,
  @JsonValue('redeemed')
  redeemed,
  @JsonValue('expired')
  expired,
  @JsonValue('cancelled')
  cancelled,
}
