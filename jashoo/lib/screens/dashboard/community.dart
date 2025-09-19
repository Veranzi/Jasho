import 'package:flutter/material.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  _CommunityScreenState createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final TextEditingController _postController = TextEditingController();

  // Mock community posts (later can fetch from Firebase or API)
  final List<Map<String, String>> _posts = [
    {
      "user": "James (Boda Boda)",
      "message": "Anyone going to town? I can connect you with passengers."
    },
    {
      "user": "Mary (Mama Fua)",
      "message": "Looking for clients in Westlands area this week."
    },
    {
      "user": "Peter (Delivery)",
      "message": "Jumia orders available, who is free to deliver?"
    },
  ];

  void _addPost(String message) {
    setState(() {
      _posts.insert(0, {"user": "You", "message": message});
    });
    _postController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Community"),
        backgroundColor: Colors.cyan,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Messages area
            Expanded(
              child: ListView.builder(
                reverse: true, // newest posts at the bottom like a chat
                itemCount: _posts.length,
                itemBuilder: (context, index) {
                  final post = _posts[index];
                  return Card(
                    margin:
                        const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
                    child: ListTile(
                      leading: CircleAvatar(
                        child: Text(post["user"]![0]), // First letter of user
                      ),
                      title: Text(post["user"]!),
                      subtitle: Text(post["message"]!),
                    ),
                  );
                },
              ),
            ),

            // Input area
            const Divider(height: 1),
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _postController,
                      decoration: const InputDecoration(
                        hintText: "Share something...",
                        border: OutlineInputBorder(),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      onSubmitted: (text) {
                        if (text.trim().isNotEmpty) {
                          _addPost(text.trim());
                        }
                      },
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send, color: Colors.cyan),
                    onPressed: () {
                      if (_postController.text.trim().isNotEmpty) {
                        _addPost(_postController.text.trim());
                      }
                    },
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
