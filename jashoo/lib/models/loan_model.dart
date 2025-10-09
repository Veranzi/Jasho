import 'package:json_annotation/json_annotation.dart';

part 'loan_model.g.dart';

@JsonSerializable()
class LoanModel {
  final String id;
  final String userId;
  final String lenderId;
  final String lenderName;
  final double principalAmount;
  final double interestRate;
  final double totalAmount;
  final double remainingAmount;
  final String currency;
  final LoanType type;
  final LoanPurpose purpose;
  final DateTime disbursedAt;
  final DateTime dueDate;
  final DateTime? nextPaymentDate;
  final LoanStatus status;
  final int totalInstallments;
  final int paidInstallments;
  final double monthlyPayment;
  final List<LoanPayment> payments;
  final Map<String, dynamic> terms;
  final String? collateral;
  final double? collateralValue;
  final Map<String, dynamic> metadata;

  LoanModel({
    required this.id,
    required this.userId,
    required this.lenderId,
    required this.lenderName,
    required this.principalAmount,
    required this.interestRate,
    required this.totalAmount,
    required this.remainingAmount,
    this.currency = 'KES',
    required this.type,
    required this.purpose,
    required this.disbursedAt,
    required this.dueDate,
    this.nextPaymentDate,
    required this.status,
    required this.totalInstallments,
    required this.paidInstallments,
    required this.monthlyPayment,
    this.payments = const [],
    this.terms = const {},
    this.collateral,
    this.collateralValue,
    this.metadata = const {},
  });

  factory LoanModel.fromJson(Map<String, dynamic> json) => _$LoanModelFromJson(json);
  Map<String, dynamic> toJson() => _$LoanModelToJson(this);
}

enum LoanType {
  @JsonValue('personal')
  personal,
  @JsonValue('business')
  business,
  @JsonValue('emergency')
  emergency,
  @JsonValue('education')
  education,
  @JsonValue('vehicle')
  vehicle,
  @JsonValue('home')
  home,
  @JsonValue('microloan')
  microloan,
  @JsonValue('payday')
  payday,
}

enum LoanPurpose {
  @JsonValue('business_expansion')
  businessExpansion,
  @JsonValue('emergency_expenses')
  emergencyExpenses,
  @JsonValue('education')
  education,
  @JsonValue('vehicle_purchase')
  vehiclePurchase,
  @JsonValue('home_improvement')
  homeImprovement,
  @JsonValue('debt_consolidation')
  debtConsolidation,
  @JsonValue('working_capital')
  workingCapital,
  @JsonValue('other')
  other,
}

enum LoanStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('approved')
  approved,
  @JsonValue('disbursed')
  disbursed,
  @JsonValue('active')
  active,
  @JsonValue('completed')
  completed,
  @JsonValue('defaulted')
  defaulted,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('restructured')
  restructured,
}

@JsonSerializable()
class LoanPayment {
  final String id;
  final String loanId;
  final double amount;
  final DateTime dueDate;
  final DateTime? paidDate;
  final PaymentStatus status;
  final double principalAmount;
  final double interestAmount;
  final double? lateFee;
  final String? paymentMethod;
  final String? reference;
  final Map<String, dynamic> metadata;

  LoanPayment({
    required this.id,
    required this.loanId,
    required this.amount,
    required this.dueDate,
    this.paidDate,
    required this.status,
    required this.principalAmount,
    required this.interestAmount,
    this.lateFee,
    this.paymentMethod,
    this.reference,
    this.metadata = const {},
  });

  factory LoanPayment.fromJson(Map<String, dynamic> json) => _$LoanPaymentFromJson(json);
  Map<String, dynamic> toJson() => _$LoanPaymentToJson(this);
}

enum PaymentStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('paid')
  paid,
  @JsonValue('overdue')
  overdue,
  @JsonValue('partial')
  partial,
  @JsonValue('waived')
  waived,
}

@JsonSerializable()
class LoanApplication {
  final String id;
  final String userId;
  final String lenderId;
  final double requestedAmount;
  final LoanType type;
  final LoanPurpose purpose;
  final String description;
  final ApplicationStatus status;
  final DateTime appliedAt;
  final DateTime? reviewedAt;
  final DateTime? approvedAt;
  final DateTime? rejectedAt;
  final String? rejectionReason;
  final Map<String, dynamic> applicationData;
  final List<String> documents;
  final Map<String, dynamic> metadata;

  LoanApplication({
    required this.id,
    required this.userId,
    required this.lenderId,
    required this.requestedAmount,
    required this.type,
    required this.purpose,
    required this.description,
    required this.status,
    required this.appliedAt,
    this.reviewedAt,
    this.approvedAt,
    this.rejectedAt,
    this.rejectionReason,
    this.applicationData = const {},
    this.documents = const [],
    this.metadata = const {},
  });

  factory LoanApplication.fromJson(Map<String, dynamic> json) => _$LoanApplicationFromJson(json);
  Map<String, dynamic> toJson() => _$LoanApplicationToJson(this);
}

enum ApplicationStatus {
  @JsonValue('draft')
  draft,
  @JsonValue('submitted')
  submitted,
  @JsonValue('under_review')
  underReview,
  @JsonValue('approved')
  approved,
  @JsonValue('rejected')
  rejected,
  @JsonValue('cancelled')
  cancelled,
}
