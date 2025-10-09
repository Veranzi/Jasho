import 'package:json_annotation/json_annotation.dart';

part 'transaction_model.g.dart';

@JsonSerializable()
class TransactionModel {
  final String id;
  final String userId;
  final TransactionType type;
  final double amount;
  final String currency;
  final String description;
  final String? category;
  final String? gigId;
  final String? jobId;
  final TransactionStatus status;
  final PaymentMethod paymentMethod;
  final String? reference;
  final String? externalReference;
  final DateTime timestamp;
  final String? location;
  final double? latitude;
  final double? longitude;
  final Map<String, dynamic> metadata;
  final bool isRecurring;
  final String? recurringId;
  final double? fees;
  final String? notes;
  final List<String> tags;
  final bool isVerified;
  final String? verificationMethod;
  final DateTime? verifiedAt;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    this.currency = 'KES',
    required this.description,
    this.category,
    this.gigId,
    this.jobId,
    required this.status,
    required this.paymentMethod,
    this.reference,
    this.externalReference,
    required this.timestamp,
    this.location,
    this.latitude,
    this.longitude,
    this.metadata = const {},
    this.isRecurring = false,
    this.recurringId,
    this.fees,
    this.notes,
    this.tags = const [],
    this.isVerified = false,
    this.verificationMethod,
    this.verifiedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) => _$TransactionModelFromJson(json);
  Map<String, dynamic> toJson() => _$TransactionModelToJson(this);

  TransactionModel copyWith({
    String? id,
    String? userId,
    TransactionType? type,
    double? amount,
    String? currency,
    String? description,
    String? category,
    String? gigId,
    String? jobId,
    TransactionStatus? status,
    PaymentMethod? paymentMethod,
    String? reference,
    String? externalReference,
    DateTime? timestamp,
    String? location,
    double? latitude,
    double? longitude,
    Map<String, dynamic>? metadata,
    bool? isRecurring,
    String? recurringId,
    double? fees,
    String? notes,
    List<String>? tags,
    bool? isVerified,
    String? verificationMethod,
    DateTime? verifiedAt,
  }) {
    return TransactionModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      description: description ?? this.description,
      category: category ?? this.category,
      gigId: gigId ?? this.gigId,
      jobId: jobId ?? this.jobId,
      status: status ?? this.status,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      reference: reference ?? this.reference,
      externalReference: externalReference ?? this.externalReference,
      timestamp: timestamp ?? this.timestamp,
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      metadata: metadata ?? this.metadata,
      isRecurring: isRecurring ?? this.isRecurring,
      recurringId: recurringId ?? this.recurringId,
      fees: fees ?? this.fees,
      notes: notes ?? this.notes,
      tags: tags ?? this.tags,
      isVerified: isVerified ?? this.isVerified,
      verificationMethod: verificationMethod ?? this.verificationMethod,
      verifiedAt: verifiedAt ?? this.verifiedAt,
    );
  }
}

enum TransactionType {
  @JsonValue('income')
  income,
  @JsonValue('expense')
  expense,
  @JsonValue('transfer')
  transfer,
  @JsonValue('savings')
  savings,
  @JsonValue('loan_payment')
  loanPayment,
  @JsonValue('insurance_payment')
  insurancePayment,
  @JsonValue('investment')
  investment,
  @JsonValue('refund')
  refund,
  @JsonValue('bonus')
  bonus,
  @JsonValue('penalty')
  penalty,
}

enum TransactionStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('completed')
  completed,
  @JsonValue('failed')
  failed,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('processing')
  processing,
  @JsonValue('disputed')
  disputed,
}

enum PaymentMethod {
  @JsonValue('mpesa')
  mpesa,
  @JsonValue('cash')
  cash,
  @JsonValue('bank_transfer')
  bankTransfer,
  @JsonValue('card')
  card,
  @JsonValue('crypto')
  crypto,
  @JsonValue('wallet')
  wallet,
  @JsonValue('cheque')
  cheque,
}
