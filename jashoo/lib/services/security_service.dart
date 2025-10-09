import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart';
import 'package:local_auth/local_auth.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:google_mlkit_barcode_scanning/google_mlkit_barcode_scanning.dart';
import 'package:url_launcher/url_launcher.dart';

class SecurityService {
  static final SecurityService _instance = SecurityService._internal();
  factory SecurityService() => _instance;
  SecurityService._internal();

  final LocalAuthentication _localAuth = LocalAuthentication();
  final Encrypter _encrypter = Encrypter(AES(Key.fromSecureRandom(32)));
  final IV _iv = IV.fromSecureRandom(16);

  // Biometric Authentication
  Future<bool> isBiometricAvailable() async {
    try {
      final isAvailable = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return isAvailable && isDeviceSupported;
    } catch (e) {
      return false;
    }
  }

  Future<bool> authenticateWithBiometrics() async {
    try {
      final isAvailable = await isBiometricAvailable();
      if (!isAvailable) return false;

      return await _localAuth.authenticate(
        localizedReason: 'Authenticate to access your financial data',
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  // Data Encryption
  String encryptData(String data) {
    try {
      final encrypted = _encrypter.encrypt(data, iv: _iv);
      return encrypted.base64;
    } catch (e) {
      throw Exception('Encryption failed: $e');
    }
  }

  String decryptData(String encryptedData) {
    try {
      final encrypted = Encrypted.fromBase64(encryptedData);
      return _encrypter.decrypt(encrypted, iv: _iv);
    } catch (e) {
      throw Exception('Decryption failed: $e');
    }
  }

  // Balance Masking
  String maskBalance(double balance) {
    final balanceStr = balance.toStringAsFixed(2);
    if (balanceStr.length <= 4) {
      return '***';
    }
    
    final visibleDigits = 2;
    final maskedPart = '*' * (balanceStr.length - visibleDigits - 1);
    return '${balanceStr.substring(0, 1)}$maskedPart${balanceStr.substring(balanceStr.length - visibleDigits)}';
  }

  String maskPhoneNumber(String phoneNumber) {
    if (phoneNumber.length < 4) return '***';
    
    final start = phoneNumber.substring(0, 3);
    final end = phoneNumber.substring(phoneNumber.length - 2);
    final masked = '*' * (phoneNumber.length - 5);
    
    return '$start$masked$end';
  }

  String maskAccountNumber(String accountNumber) {
    if (accountNumber.length < 4) return '***';
    
    final start = accountNumber.substring(0, 2);
    final end = accountNumber.substring(accountNumber.length - 2);
    final masked = '*' * (accountNumber.length - 4);
    
    return '$start$masked$end';
  }

  // Document Security Scanning
  Future<DocumentScanResult> scanDocument(Uint8List imageBytes) async {
    try {
      final inputImage = InputImage.fromBytes(
        bytes: imageBytes,
        metadata: InputImageMetadata(
          size: Size(1000, 1000),
          rotation: ImageRotation.rotation0,
          format: InputImageFormat.bgra8888,
          bytesPerRow: 1000 * 4,
        ),
      );

      final textRecognizer = TextRecognizer();
      final recognizedText = await textRecognizer.processImage(inputImage);
      
      final result = DocumentScanResult(
        isSafe: true,
        detectedText: recognizedText.text,
        securityIssues: [],
        confidence: 1.0,
      );

      // Check for suspicious patterns
      final securityIssues = _analyzeTextForSecurityIssues(recognizedText.text);
      if (securityIssues.isNotEmpty) {
        result.isSafe = false;
        result.securityIssues = securityIssues;
        result.confidence = 0.3;
      }

      await textRecognizer.close();
      return result;
    } catch (e) {
      return DocumentScanResult(
        isSafe: false,
        detectedText: '',
        securityIssues: ['Document scanning failed: $e'],
        confidence: 0.0,
      );
    }
  }

  // QR Code Security Scanning
  Future<QRScanResult> scanQRCode(Uint8List imageBytes) async {
    try {
      final inputImage = InputImage.fromBytes(
        bytes: imageBytes,
        metadata: InputImageMetadata(
          size: Size(1000, 1000),
          rotation: ImageRotation.rotation0,
          format: InputImageFormat.bgra8888,
          bytesPerRow: 1000 * 4,
        ),
      );

      final barcodeScanner = BarcodeScanner();
      final barcodes = await barcodeScanner.processImage(inputImage);
      
      if (barcodes.isEmpty) {
        return QRScanResult(
          isSafe: false,
          content: '',
          securityIssues: ['No QR code detected'],
          confidence: 0.0,
        );
      }

      final barcode = barcodes.first;
      final content = barcode.displayValue ?? '';
      
      final result = QRScanResult(
        isSafe: true,
        content: content,
        securityIssues: [],
        confidence: 1.0,
      );

      // Check for malicious URLs or content
      final securityIssues = _analyzeQRContentForSecurityIssues(content);
      if (securityIssues.isNotEmpty) {
        result.isSafe = false;
        result.securityIssues = securityIssues;
        result.confidence = 0.2;
      }

      await barcodeScanner.close();
      return result;
    } catch (e) {
      return QRScanResult(
        isSafe: false,
        content: '',
        securityIssues: ['QR code scanning failed: $e'],
        confidence: 0.0,
      );
    }
  }

  // URL Security Check
  Future<bool> isUrlSafe(String url) async {
    try {
      // Check if URL is valid
      final uri = Uri.parse(url);
      if (!uri.hasScheme || (!uri.scheme.startsWith('http'))) {
        return false;
      }

      // Check against known malicious patterns
      final maliciousPatterns = [
        'phishing',
        'scam',
        'fake',
        'malware',
        'virus',
        'hack',
        'steal',
        'fraud',
      ];

      final urlLower = url.toLowerCase();
      for (final pattern in maliciousPatterns) {
        if (urlLower.contains(pattern)) {
          return false;
        }
      }

      // Check domain reputation (simplified)
      final domain = uri.host;
      final suspiciousDomains = [
        'bit.ly',
        'tinyurl.com',
        'short.link',
        // Add more suspicious domains
      ];

      if (suspiciousDomains.contains(domain)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // Transaction Security
  Future<TransactionSecurityResult> validateTransaction({
    required double amount,
    required String recipient,
    required String description,
    required String location,
  }) async {
    final issues = <String>[];

    // Amount validation
    if (amount <= 0) {
      issues.add('Invalid transaction amount');
    } else if (amount > 100000) { // Large amount threshold
      issues.add('Large transaction amount - please verify');
    }

    // Recipient validation
    if (recipient.isEmpty) {
      issues.add('Recipient information is required');
    } else if (recipient.length < 3) {
      issues.add('Invalid recipient information');
    }

    // Description validation
    if (description.isEmpty) {
      issues.add('Transaction description is required');
    }

    // Location validation
    if (location.isEmpty) {
      issues.add('Transaction location is required');
    }

    return TransactionSecurityResult(
      isSecure: issues.isEmpty,
      securityIssues: issues,
      riskScore: issues.length * 0.2,
      recommendations: _generateSecurityRecommendations(issues),
    );
  }

  // Password Security
  PasswordSecurityResult validatePassword(String password) {
    final issues = <String>[];
    int score = 0;

    // Length check
    if (password.length < 8) {
      issues.add('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Uppercase check
    if (!password.contains(RegExp(r'[A-Z]'))) {
      issues.add('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase check
    if (!password.contains(RegExp(r'[a-z]'))) {
      issues.add('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number check
    if (!password.contains(RegExp(r'[0-9]'))) {
      issues.add('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character check
    if (!password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      issues.add('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common password check
    final commonPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', 'dragon',
    ];
    if (commonPasswords.contains(password.toLowerCase())) {
      issues.add('Password is too common');
      score = 0;
    }

    return PasswordSecurityResult(
      isSecure: issues.isEmpty,
      securityIssues: issues,
      strengthScore: score / 5.0,
      strengthLevel: _getPasswordStrengthLevel(score),
    );
  }

  // Private helper methods
  List<String> _analyzeTextForSecurityIssues(String text) {
    final issues = <String>[];
    final textLower = text.toLowerCase();

    // Check for suspicious patterns
    final suspiciousPatterns = [
      'password',
      'pin',
      'secret',
      'confidential',
      'private key',
      'bank account',
      'credit card',
      'ssn',
      'social security',
    ];

    for (final pattern in suspiciousPatterns) {
      if (textLower.contains(pattern)) {
        issues.add('Document contains sensitive information: $pattern');
      }
    }

    // Check for URLs
    final urlPattern = RegExp(r'https?://[^\s]+');
    final urls = urlPattern.allMatches(text);
    for (final match in urls) {
      final url = match.group(0)!;
      if (!_isUrlSafe(url)) {
        issues.add('Document contains potentially unsafe URL: $url');
      }
    }

    return issues;
  }

  List<String> _analyzeQRContentForSecurityIssues(String content) {
    final issues = <String>[];

    // Check if it's a URL
    if (content.startsWith('http://') || content.startsWith('https://')) {
      if (!_isUrlSafe(content)) {
        issues.add('QR code contains potentially unsafe URL');
      }
    }

    // Check for suspicious content
    final suspiciousPatterns = [
      'phishing',
      'scam',
      'fake',
      'malware',
      'virus',
      'hack',
      'steal',
      'fraud',
    ];

    final contentLower = content.toLowerCase();
    for (final pattern in suspiciousPatterns) {
      if (contentLower.contains(pattern)) {
        issues.add('QR code contains suspicious content: $pattern');
      }
    }

    return issues;
  }

  bool _isUrlSafe(String url) {
    try {
      final uri = Uri.parse(url);
      final domain = uri.host.toLowerCase();
      
      // Check against known safe domains
      final safeDomains = [
        'google.com',
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'linkedin.com',
        'github.com',
        'stackoverflow.com',
        // Add more safe domains
      ];

      return safeDomains.any((safeDomain) => domain.contains(safeDomain));
    } catch (e) {
      return false;
    }
  }

  List<String> _generateSecurityRecommendations(List<String> issues) {
    final recommendations = <String>[];

    if (issues.contains('Large transaction amount - please verify')) {
      recommendations.add('Verify the recipient and amount before proceeding');
      recommendations.add('Consider splitting large transactions');
    }

    if (issues.contains('Invalid recipient information')) {
      recommendations.add('Double-check the recipient details');
      recommendations.add('Use saved contacts when possible');
    }

    if (issues.isEmpty) {
      recommendations.add('Transaction appears secure');
      recommendations.add('Always verify details before confirming');
    }

    return recommendations;
  }

  String _getPasswordStrengthLevel(int score) {
    if (score < 2) return 'Weak';
    if (score < 4) return 'Medium';
    if (score < 5) return 'Strong';
    return 'Very Strong';
  }
}

// Data classes for security results
class DocumentScanResult {
  final bool isSafe;
  final String detectedText;
  final List<String> securityIssues;
  final double confidence;

  DocumentScanResult({
    required this.isSafe,
    required this.detectedText,
    required this.securityIssues,
    required this.confidence,
  });
}

class QRScanResult {
  final bool isSafe;
  final String content;
  final List<String> securityIssues;
  final double confidence;

  QRScanResult({
    required this.isSafe,
    required this.content,
    required this.securityIssues,
    required this.confidence,
  });
}

class TransactionSecurityResult {
  final bool isSecure;
  final List<String> securityIssues;
  final double riskScore;
  final List<String> recommendations;

  TransactionSecurityResult({
    required this.isSecure,
    required this.securityIssues,
    required this.riskScore,
    required this.recommendations,
  });
}

class PasswordSecurityResult {
  final bool isSecure;
  final List<String> securityIssues;
  final double strengthScore;
  final String strengthLevel;

  PasswordSecurityResult({
    required this.isSecure,
    required this.securityIssues,
    required this.strengthScore,
    required this.strengthLevel,
  });
}
