import 'package:json_annotation/json_annotation.dart';

part 'job_model.g.dart';

@JsonSerializable()
class JobModel {
  final String id;
  final String title;
  final String description;
  final String category;
  final String subcategory;
  final JobType type;
  final double payRate;
  final String currency;
  final PayType payType;
  final String location;
  final double latitude;
  final double longitude;
  final int radiusKm;
  final DateTime postedAt;
  final DateTime? deadline;
  final DateTime? startDate;
  final DateTime? endDate;
  final JobStatus status;
  final String employerId;
  final String employerName;
  final String? employerImageUrl;
  final double employerRating;
  final List<String> requiredSkills;
  final List<String> preferredSkills;
  final String experienceLevel;
  final String educationLevel;
  final bool requiresVehicle;
  final String? vehicleType;
  final List<String> images;
  final Map<String, dynamic> requirements;
  final Map<String, dynamic> benefits;
  final int maxApplicants;
  final int currentApplicants;
  final List<String> tags;
  final bool isUrgent;
  final bool isVerified;
  final String? verificationMethod;
  final Map<String, dynamic> metadata;
  final double? estimatedDuration;
  final String? durationUnit;
  final List<String> applicationRequirements;
  final String? applicationInstructions;
  final bool isRemote;
  final String? remoteDetails;

  JobModel({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.subcategory,
    required this.type,
    required this.payRate,
    this.currency = 'KES',
    required this.payType,
    required this.location,
    required this.latitude,
    required this.longitude,
    this.radiusKm = 10,
    required this.postedAt,
    this.deadline,
    this.startDate,
    this.endDate,
    required this.status,
    required this.employerId,
    required this.employerName,
    this.employerImageUrl,
    this.employerRating = 0.0,
    this.requiredSkills = const [],
    this.preferredSkills = const [],
    required this.experienceLevel,
    required this.educationLevel,
    this.requiresVehicle = false,
    this.vehicleType,
    this.images = const [],
    this.requirements = const {},
    this.benefits = const {},
    this.maxApplicants = 1,
    this.currentApplicants = 0,
    this.tags = const [],
    this.isUrgent = false,
    this.isVerified = false,
    this.verificationMethod,
    this.metadata = const {},
    this.estimatedDuration,
    this.durationUnit,
    this.applicationRequirements = const [],
    this.applicationInstructions,
    this.isRemote = false,
    this.remoteDetails,
  });

  factory JobModel.fromJson(Map<String, dynamic> json) => _$JobModelFromJson(json);
  Map<String, dynamic> toJson() => _$JobModelToJson(this);
}

enum JobType {
  @JsonValue('full_time')
  fullTime,
  @JsonValue('part_time')
  partTime,
  @JsonValue('contract')
  contract,
  @JsonValue('freelance')
  freelance,
  @JsonValue('gig')
  gig,
  @JsonValue('internship')
  internship,
  @JsonValue('volunteer')
  volunteer,
}

enum PayType {
  @JsonValue('hourly')
  hourly,
  @JsonValue('daily')
  daily,
  @JsonValue('weekly')
  weekly,
  @JsonValue('monthly')
  monthly,
  @JsonValue('per_project')
  perProject,
  @JsonValue('per_task')
  perTask,
  @JsonValue('commission')
  commission,
  @JsonValue('fixed')
  fixed,
}

enum JobStatus {
  @JsonValue('active')
  active,
  @JsonValue('paused')
  paused,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('expired')
  expired,
  @JsonValue('filled')
  filled,
}

@JsonSerializable()
class JobApplication {
  final String id;
  final String jobId;
  final String userId;
  final ApplicationStatus status;
  final DateTime appliedAt;
  final DateTime? reviewedAt;
  final DateTime? acceptedAt;
  final DateTime? rejectedAt;
  final String? coverLetter;
  final List<String> attachments;
  final Map<String, dynamic> additionalInfo;
  final String? rejectionReason;
  final String? notes;
  final double? proposedRate;
  final DateTime? availableFrom;
  final Map<String, dynamic> metadata;

  JobApplication({
    required this.id,
    required this.jobId,
    required this.userId,
    required this.status,
    required this.appliedAt,
    this.reviewedAt,
    this.acceptedAt,
    this.rejectedAt,
    this.coverLetter,
    this.attachments = const [],
    this.additionalInfo = const {},
    this.rejectionReason,
    this.notes,
    this.proposedRate,
    this.availableFrom,
    this.metadata = const {},
  });

  factory JobApplication.fromJson(Map<String, dynamic> json) => _$JobApplicationFromJson(json);
  Map<String, dynamic> toJson() => _$JobApplicationToJson(this);
}

enum ApplicationStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('reviewed')
  reviewed,
  @JsonValue('accepted')
  accepted,
  @JsonValue('rejected')
  rejected,
  @JsonValue('withdrawn')
  withdrawn,
  @JsonValue('shortlisted')
  shortlisted,
}
