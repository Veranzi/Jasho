import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/jobs_provider.dart';

class PostJobScreen extends StatefulWidget {
  const PostJobScreen({super.key});

  @override
  State<PostJobScreen> createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _loc = TextEditingController();
  final _price = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post a Job')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 8),
            TextField(controller: _desc, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: 8),
            TextField(controller: _loc, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: 8),
            TextField(controller: _price, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price (KES)')),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final price = double.tryParse(_price.text.trim()) ?? 0;
                if (_title.text.trim().isEmpty || price <= 0) return;
                context.read<JobsProvider>().postJob(JobItem(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      title: _title.text.trim(),
                      description: _desc.text.trim(),
                      location: _loc.text.trim(),
                      priceKes: price,
                    ));
                Navigator.pop(context);
              },
              child: const Text('Post'),
            ),
          ],
        ),
      ),
    );
  }
}

