import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QRScanScreen extends StatefulWidget {
  const QRScanScreen({super.key});

  @override
  State<QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends State<QRScanScreen> {
  final MobileScannerController controller = MobileScannerController();

  void _handleScannedQRCode(String qrCode) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('QR Code: $qrCode')),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("QR Scanner"),
        actions: [
          // 🔦 Torch toggle
          ValueListenableBuilder<TorchState>(
            valueListenable: controller.torchState,
            builder: (context, state, child) {
              switch (state) {
                case TorchState.off:
                  return IconButton(
                    icon: const Icon(Icons.flash_off, color: Colors.grey),
                    onPressed: () => controller.toggleTorch(),
                    tooltip: 'Toggle Torch',
                  );
                case TorchState.on:
                  return IconButton(
                    icon: const Icon(Icons.flash_on, color: Colors.yellow),
                    onPressed: () => controller.toggleTorch(),
                    tooltip: 'Toggle Torch',
                  );
              }
            },
          ),

          // 📷 Camera switch
          ValueListenableBuilder<CameraFacing>(
            valueListenable: controller.cameraFacingState,
            builder: (context, facing, child) {
              switch (facing) {
                case CameraFacing.front:
                  return IconButton(
                    icon: const Icon(Icons.camera_front),
                    onPressed: () => controller.switchCamera(),
                    tooltip: 'Switch Camera',
                  );
                case CameraFacing.back:
                  return IconButton(
                    icon: const Icon(Icons.camera_rear),
                    onPressed: () => controller.switchCamera(),
                    tooltip: 'Switch Camera',
                  );
              }
            },
          ),
        ],
      ),
      body: MobileScanner(
        controller: controller,
        onDetect: (capture) {
          for (final barcode in capture.barcodes) {
            final rawValue = barcode.rawValue;
            if (rawValue != null) {
              _handleScannedQRCode(rawValue);
            }
          }
        },
      ),
    );
  }
}
