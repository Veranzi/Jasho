import 'package:flutter/foundation.dart';

enum JobStatus { pending, inProgress, completed, paid }

class JobItem {
  final String id;
  String title;
  String description;
  String location;
  double priceKes;
  JobStatus status;
  double? rating; // post-completion
  String? review;

  JobItem({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.priceKes,
    this.status = JobStatus.pending,
    this.rating,
    this.review,
  });
}

class JobsProvider extends ChangeNotifier {
  final List<JobItem> _jobs = [
    JobItem(
      id: 'job-1',
      title: 'Boda Boda Delivery',
      description: 'Deliver parcels within Nairobi CBD',
      location: 'Nairobi CBD',
      priceKes: 500,
    ),
    JobItem(
      id: 'job-2',
      title: 'Mama Fua – Cleaning',
      description: 'House cleaning, flexible hours',
      location: 'Westlands',
      priceKes: 800,
    ),
  ];

  List<JobItem> get jobs => List.unmodifiable(_jobs);

  void postJob(JobItem job) {
    _jobs.insert(0, job);
    notifyListeners();
  }

  JobItem? getById(String id) {
    try {
      return _jobs.firstWhere((j) => j.id == id);
    } catch (_) {
      return null;
    }
  }

  void applyForJob(String id) {
    // no-op for now, could flag application state
    notifyListeners();
  }

  void updateStatus(String id, JobStatus status) {
    final job = getById(id);
    if (job == null) return;
    job.status = status;
    notifyListeners();
  }

  void addReview(String id, double rating, String review) {
    final job = getById(id);
    if (job == null) return;
    job.rating = rating;
    job.review = review;
    notifyListeners();
  }
}

