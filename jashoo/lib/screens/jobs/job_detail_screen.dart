import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/jobs_provider.dart';

class JobDetailScreen extends StatelessWidget {
  const JobDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final jobId = ModalRoute.of(context)?.settings.arguments as String?;
    final jobs = context.watch<JobsProvider>();
    final job = jobId != null ? jobs.getById(jobId) : null;
    if (job == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Job')),
        body: const Center(child: Text('Job not found')),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(job.title)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(job.description),
            const SizedBox(height: 8),
            Text('Location: ${job.location}'),
            const SizedBox(height: 8),
            Text('Price: KES ${job.priceKes.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Wrap(spacing: 8, children: [
              ElevatedButton(
                onPressed: () => jobs.updateStatus(job.id, JobStatus.inProgress),
                child: const Text('Start'),
              ),
              ElevatedButton(
                onPressed: () => jobs.updateStatus(job.id, JobStatus.completed),
                child: const Text('Complete'),
              ),
              ElevatedButton(
                onPressed: () => jobs.updateStatus(job.id, JobStatus.paid),
                child: const Text('Mark Paid'),
              ),
            ]),
            const Spacer(),
            ElevatedButton(
              onPressed: () => _showReviewDialog(context, jobs, job.id),
              child: const Text('Leave Review'),
            )
          ],
        ),
      ),
    );
  }
}

Future<void> _showReviewDialog(BuildContext context, JobsProvider jobs, String jobId) async {
  final ratingController = TextEditingController();
  final reviewController = TextEditingController();
  await showDialog(
    context: context,
    builder: (_) => AlertDialog(
      title: const Text('Review'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: ratingController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Rating (0-5)'),
          ),
          TextField(
            controller: reviewController,
            decoration: const InputDecoration(labelText: 'Comment'),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        TextButton(
          onPressed: () {
            final r = double.tryParse(ratingController.text.trim()) ?? 0;
            jobs.addReview(jobId, r, reviewController.text.trim());
            Navigator.pop(context);
          },
          child: const Text('Save'),
        )
      ],
    ),
  );
}

