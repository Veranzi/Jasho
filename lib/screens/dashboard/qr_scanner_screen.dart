import 'package:flutter/material.dart';

class QrCodeScannerPage extends StatelessWidget {
  const QrCodeScannerPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("QR Code Scanner")),
      body: const Center(
        child: Text("QR Scanner Placeholder", style: TextStyle(fontSize: 18)),
      ),
    );
  }
}
