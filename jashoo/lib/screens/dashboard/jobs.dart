import 'package:flutter/material.dart';

class JobsPage extends StatelessWidget {
  const JobsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D47A1), // JASHO primary blue
        title: const Text("Jobs Marketplace"),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            "Available Gigs",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Sample job cards
          _buildJobCard(
            context,
            title: "Boda Boda Delivery",
            description: "Earn by delivering parcels within Nairobi.",
            price: "KES 500/trip",
          ),
          _buildJobCard(
            context,
            title: "Mama Fua – Cleaning Job",
            description: "House cleaning job, flexible hours.",
            price: "KES 800/day",
          ),
          _buildJobCard(
            context,
            title: "Handyman Work",
            description: "Fixing small household repairs.",
            price: "KES 1000/job",
          ),
        ],
      ),
    );
  }

  /// FIX: Now we pass `BuildContext context`
  Widget _buildJobCard(
    BuildContext context, {
    required String title,
    required String description,
    required String price,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(description, style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(price,
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.green)),
                ElevatedButton(
                  onPressed: () {
                    // Show confirmation
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text("Applied for $title")),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0D47A1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text("Apply"),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
