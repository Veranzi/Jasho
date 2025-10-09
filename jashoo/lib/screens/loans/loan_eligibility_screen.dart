import 'package:flutter/material.dart';
//import 'package:flutter/src/foundation/change_notifier.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:io';
import 'package:flutter/foundation.dart';

class LoanEligibilityScreen extends StatefulWidget {
  const LoanEligibilityScreen({super.key});

  @override
  State<LoanEligibilityScreen> createState() => _LoanEligibilityScreenState();
}

class _LoanEligibilityScreenState extends State<LoanEligibilityScreen> {
  final _formKey = GlobalKey<FormState>();
  final _saccoIdController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String _selectedSacco = '';
  String _selectedEvidenceType = 'M-Pesa Statement';
  final List<File> _uploadedDocuments = [];
  bool _isLoading = false;

  final List<String> _saccos = [
    'Stima SACCO',
    'Mwalimu SACCO',
    'Kenya Police SACCO',
    'Kenya Teachers SACCO',
    'Kenya Defense Forces SACCO',
    'Kenya Power SACCO',
    'Kenya Airways SACCO',
    'Kenya Commercial Bank SACCO',
    'Cooperative Bank SACCO',
    'National Bank SACCO',
    'Kenya Revenue Authority SACCO',
    'Kenya Railways SACCO',
    'Kenya Ports Authority SACCO',
    'Kenya Posta SACCO',
    'Kenya Broadcasting Corporation SACCO',
    'Kenya Wildlife Service SACCO',
    'Kenya Forest Service SACCO',
    'Kenya Meteorological Department SACCO',
    'Kenya Medical Research Institute SACCO',
    'Kenya Agricultural Research Institute SACCO',
    'Kenya Industrial Research Institute SACCO',
    'Kenya Bureau of Standards SACCO',
    'Kenya National Examinations Council SACCO',
    'Kenya Institute of Curriculum Development SACCO',
    'Kenya Institute of Special Education SACCO',
    'Kenya Institute of Mass Communication SACCO',
    'Kenya Institute of Administration SACCO',
    'Kenya Institute of Management SACCO',
    'Kenya Institute of Public Policy Research SACCO',
    'Kenya Institute of Economic Affairs SACCO',
    'Other SACCO/Chama',
  ];

  final List<String> _evidenceTypes = [
    'M-Pesa Statement',
    'Bank Statement',
    'Cash Receipt',
    'SACCO Statement',
    'Chama Contribution Record',
    'Other Document',
  ];

  @override
  void dispose() {
    _saccoIdController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Image.asset('assets/logo1.png', height: 28),
        centerTitle: true,
        backgroundColor: const Color(0xFF10B981),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildSaccoDetailsSection(),
              const SizedBox(height: 24),
              _buildEvidenceSection(),
              const SizedBox(height: 24),
              _buildDocumentUploadSection(),
              const SizedBox(height: 24),
              _buildSubmitButton(),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.trending_up, color: Colors.white, size: 28),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Increase Loan Eligibility',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Provide SACCO details and evidence to qualify for higher loan amounts',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSaccoDetailsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[300]!),
        boxShadow: [
          BoxShadow(color: Colors.grey.withAlpha(26),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SACCO/Chama Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF10B981),
            ),
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: () => _showSaccoSearchDialog(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[400]!),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                children: [
                  const Icon(Icons.business, color: Color(0xFF10B981)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedSacco.isEmpty ? 'Choose your SACCO or Chama' : _selectedSacco,
                      style: TextStyle(
                        color: _selectedSacco.isEmpty ? Colors.grey[600] : Colors.black,
                        fontSize: 16,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _saccoIdController,
            decoration: const InputDecoration(
              labelText: 'Your Membership/Account Number',
              hintText: 'Your unique identifier in the SACCO',
              prefixIcon: Icon(Icons.badge),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your membership number';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Amount Contributed (KES)',
              hintText: 'Total amount you have contributed',
              prefixIcon: Icon(Icons.money),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter the amount contributed';
              }
              final amount = double.tryParse(value);
              if (amount == null || amount <= 0) {
                return 'Please enter a valid amount';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descriptionController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Additional Details (Optional)',
              hintText: 'Any additional information about your contributions...',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEvidenceSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[300]!),
        boxShadow: [
          BoxShadow(color: Colors.grey.withAlpha(26),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Evidence Type',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF10B981),
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _selectedEvidenceType,
            decoration: const InputDecoration(
              labelText: 'Select evidence type',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.description),
            ),
            items: _evidenceTypes.map((String type) {
              return DropdownMenuItem<String>(
                value: type,
                child: Text(type),
              );
            }).toList(),
            onChanged: (String? newValue) {
              setState(() {
                _selectedEvidenceType = newValue!;
              });
            },
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please select an evidence type';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          _buildEvidenceTypeDescription(),
        ],
      ),
    );
  }

  Widget _buildEvidenceTypeDescription() {
    String description = '';
    IconData icon = Icons.description;
    
    switch (_selectedEvidenceType) {
      case 'M-Pesa Statement':
        description = 'Upload M-Pesa statements showing SACCO contributions';
        icon = Icons.phone_android;
        break;
      case 'Bank Statement':
        description = 'Upload bank statements showing SACCO transfers';
        icon = Icons.account_balance;
        break;
      case 'Cash Receipt':
        description = 'Upload receipts or payment confirmations';
        icon = Icons.receipt;
        break;
      case 'SACCO Statement':
        description = 'Upload official SACCO contribution statements';
        icon = Icons.business;
        break;
      case 'Chama Contribution Record':
        description = 'Upload chama contribution records or meeting minutes';
        icon = Icons.groups;
        break;
      case 'Other Document':
        description = 'Upload any other relevant supporting documents';
        icon = Icons.attach_file;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withAlpha(26),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF10B981).withAlpha(77)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF10B981), size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              description,
              style: const TextStyle(
                color: Color(0xFF10B981),
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentUploadSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[300]!),
        boxShadow: [
          BoxShadow(color: Colors.grey.withAlpha(26),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.upload_file, color: Color(0xFF10B981)),
              const SizedBox(width: 8),
              const Text(
                'Upload Documents',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF10B981),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Upload clear photos or PDFs of your evidence documents',
            style: TextStyle(
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 400;
              
              if (isWide) {
                // Wide screen: horizontal layout
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _pickDocuments,
                            icon: const Icon(Icons.add_photo_alternate, size: 18),
                            label: const Text('Upload', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF10B981),
                              side: const BorderSide(color: Color(0xFF10B981)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _takePhoto,
                            icon: const Icon(Icons.camera_alt, size: 18),
                            label: const Text('Photo', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF10B981),
                              side: const BorderSide(color: Color(0xFF10B981)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _scanDocument,
                            icon: const Icon(Icons.document_scanner, size: 18),
                            label: const Text('Scan', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF10B981),
                              side: const BorderSide(color: Color(0xFF10B981)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Upload • Take Photo • Scan Documents',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 11,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                );
              } else {
                // Narrow screen: vertical layout
                return Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _pickDocuments,
                        icon: const Icon(Icons.add_photo_alternate),
                        label: const Text('Upload Documents'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF10B981),
                          side: const BorderSide(color: Color(0xFF10B981)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _takePhoto,
                            icon: const Icon(Icons.camera_alt),
                            label: const Text('Take Photo'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF10B981),
                              side: const BorderSide(color: Color(0xFF10B981)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _scanDocument,
                            icon: const Icon(Icons.document_scanner),
                            label: const Text('Scan'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF10B981),
                              side: const BorderSide(color: Color(0xFF10B981)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              }
            },
          ),
          if (_uploadedDocuments.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Uploaded Documents:',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            ...(_uploadedDocuments.asMap().entries.map((entry) {
              int index = entry.key;
              File file = entry.value;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    Icon(
                      file.path.contains('qr_code_') 
                          ? Icons.qr_code_scanner 
                          : Icons.description, 
                      color: const Color(0xFF10B981)
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        file.path.contains('qr_code_') 
                            ? 'QR Code Scanned'
                            : 'Document ${index + 1}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                    IconButton(
                      onPressed: () => _removeDocument(index),
                      icon: const Icon(Icons.delete, color: Colors.red),
                    ),
                  ],
                ),
              );
            }).toList()),
          ],
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submitApplication,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF10B981),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: _isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : const Text(
                'Submit Eligibility Application',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }

  Future<void> _pickDocuments() async {
    final ImagePicker picker = ImagePicker();
    final List<XFile> images = await picker.pickMultiImage();
    
    setState(() {
      _uploadedDocuments.addAll(images.map((image) => File(image.path)));
    });
  }

  Future<void> _takePhoto() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.camera);
    
    if (image != null) {
      setState(() {
        _uploadedDocuments.add(File(image.path));
      });
    }
  }

  Future<void> _scanDocument() async {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _QRScanScreen(
          onQRCodeScanned: (qrCodeData) {
            // Handle the scanned QR code data
            _handleScannedQRCode(qrCodeData);
          },
        ),
      ),
    );
  }

  void _handleScannedQRCode(String qrCodeData) {
    // Show dialog with scanned data
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.qr_code_scanner, color: Colors.green),
              const SizedBox(width: 8),
              const Text('QR Code Scanned'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('QR Code Data:'),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: SelectableText(
                  qrCodeData,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'This QR code data will be included with your application as evidence.',
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                
                // Add QR code data as a virtual document
                setState(() {
                  // Create a virtual file entry for QR code data
                  // We'll store this as a special entry in our documents list
                  _uploadedDocuments.add(File('qr_code_${DateTime.now().millisecondsSinceEpoch}.txt'));
                });
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('QR Code data added to application!'),
                    backgroundColor: Colors.green,
                    duration: Duration(seconds: 2),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
              ),
              child: const Text('Add to Application'),
            ),
          ],
        );
      },
    );
  }

  void _removeDocument(int index) {
    setState(() {
      _uploadedDocuments.removeAt(index);
    });
  }

  void _showSaccoSearchDialog(BuildContext context) {
    final TextEditingController searchController = TextEditingController();
    List<String> filteredSaccos = List.from(_saccos);

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Row(
                children: [
                  const Icon(Icons.business, color: Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Select SACCO/Chama',
                      style: TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                height: 400,
                child: Column(
                  children: [
                    // Search field
                    TextField(
                      controller: searchController,
                      decoration: InputDecoration(
                        hintText: 'Search SACCO...',
                        prefixIcon: const Icon(Icons.search),
                        border: const OutlineInputBorder(),
                        suffixIcon: searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  searchController.clear();
                                  setDialogState(() {
                                    filteredSaccos = List.from(_saccos);
                                  });
                                },
                              )
                            : null,
                      ),
                      onChanged: (value) {
                        setDialogState(() {
                          filteredSaccos = _saccos
                              .where((sacco) =>
                                  sacco.toLowerCase().contains(value.toLowerCase()))
                              .toList();
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    // SACCO list
                    Expanded(
                      child: ListView.builder(
                        itemCount: filteredSaccos.length,
                        itemBuilder: (context, index) {
                          final sacco = filteredSaccos[index];
                          final isSelected = sacco == _selectedSacco;
                          
                          return ListTile(
                            leading: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Center(
                                child: Text(
                                  sacco.substring(0, 1),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF10B981),
                                  ),
                                ),
                              ),
                            ),
                            title: Text(
                              sacco,
                              style: TextStyle(
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected ? const Color(0xFF10B981) : Colors.black,
                              ),
                            ),
                            trailing: isSelected
                                ? const Icon(Icons.check_circle, color: Color(0xFF10B981))
                                : null,
                            onTap: () {
                              setState(() {
                                _selectedSacco = sacco;
                              });
                              Navigator.of(context).pop();
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _submitApplication() async {
    if (_selectedSacco.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a SACCO/Chama'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_uploadedDocuments.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload at least one document'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
    });

    // Show success dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green),
              const SizedBox(width: 8),
              const Text('Application Submitted'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your loan eligibility application has been submitted successfully.'),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('SACCO: $_selectedSacco'),
                      Text('Amount: KES ${_amountController.text}'),
                      Text('Evidence: $_selectedEvidenceType'),
                      Text('Documents: ${_uploadedDocuments.length} uploaded'),
                    ],
                  ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Our team will review your application within 2-3 business days and update your loan eligibility accordingly.',
                style: TextStyle(fontSize: 14),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop(); // Go back to loans screen
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
              ),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }
}

class _QRScanScreen extends StatefulWidget {
  final Function(String) onQRCodeScanned;

  const _QRScanScreen({required this.onQRCodeScanned});

  @override
  State<_QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends State<_QRScanScreen> {
  MobileScannerController controller = MobileScannerController();
  String? scannedData;
  bool isScanning = true;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () => controller.toggleTorch(),
            icon: ValueListenableBuilder(
              valueListenable: controller.torchState ?? ValueNotifier(null),
              builder: (context, state, child) {
                switch (state) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: Colors.yellow);
                  default:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                }
              },
            ),
            tooltip: 'Toggle Flash',
          ),
          IconButton(
            onPressed: () => controller.switchCamera(),
            icon: ValueListenableBuilder(
              valueListenable: controller.cameraFacing ?? ValueNotifier(CameraFacing.back),
              builder: (context, facing, child) {
                switch (facing) {
                  case CameraFacing.front:
                    return const Icon(Icons.camera_front);
                  case CameraFacing.back:
                    return const Icon(Icons.camera_rear);
                  // Default icon
                }
              },
            ),
            tooltip: 'Switch Camera',
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _foundBarcode,
          ),
          // Custom overlay
          Container(
            decoration: BoxDecoration(
              // ignore: deprecated_member_use
              color: Colors.black.withOpacity(0.5),
            ),
            child: Stack(
              children: [
                // Cut out the scanning area
                Center(
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: const Color(0xFF10B981),
                        width: 3,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Stack(
                      children: [
                        // Corner indicators
                        Positioned(
                          top: 0,
                          left: 0,
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(20),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 0,
                          right: 0,
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              borderRadius: BorderRadius.only(
                                topRight: Radius.circular(20),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          left: 0,
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(20),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              borderRadius: BorderRadius.only(
                                bottomRight: Radius.circular(20),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Instructions
                Positioned(
                  bottom: 100,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: [
                        const Text(
                          'Position the QR code within the frame',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () {
                                setState(() {
                                  isScanning = !isScanning;
                                });
                                if (isScanning) {
                                  controller.start();
                                } else {
                                  controller.stop();
                                }
                              },
                              icon: Icon(isScanning ? Icons.pause : Icons.play_arrow),
                              label: Text(isScanning ? 'Pause' : 'Resume'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                foregroundColor: Colors.white,
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              icon: const Icon(Icons.close),
                              label: const Text('Cancel'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _foundBarcode(BarcodeCapture capture) {
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        setState(() {
          scannedData = barcode.rawValue;
        });
        
        // Stop scanning and return the result
        controller.stop();
        Navigator.of(context).pop();
        widget.onQRCodeScanned(barcode.rawValue!);
        break;
      }
    }
  }
}

extension on MobileScannerController {
  ValueListenable<CameraFacing>? get cameraFacing => cameraFacingStateStream;
  
  ValueListenable<Object?>? get torchState => null;
  
  ValueListenable<CameraFacing>? get cameraFacingStateStream => null;
}