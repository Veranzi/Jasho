import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentService {
  static final PaymentService _instance = PaymentService._internal();
  factory PaymentService() => _instance;
  PaymentService._internal();

  final String _mpesaBaseUrl = 'https://sandbox.safaricom.co.ke'; // Use production URL for live
  final String _consumerKey = 'YOUR_MPESA_CONSUMER_KEY';
  final String _consumerSecret = 'YOUR_MPESA_CONSUMER_SECRET';
  final String _passkey = 'YOUR_MPESA_PASSKEY';
  final String _shortcode = 'YOUR_MPESA_SHORTCODE';

  // M-Pesa STK Push
  Future<MpesaResponse> initiateSTKPush({
    required String phoneNumber,
    required double amount,
    required String accountReference,
    required String transactionDesc,
  }) async {
    try {
      final accessToken = await _getAccessToken();
      
      final timestamp = DateTime.now().toIso8601String().replaceAll(RegExp(r'[-:.]'), '');
      final password = base64Encode(utf8.encode('$_shortcode$_passkey$timestamp'));
      
      final requestBody = {
        'BusinessShortCode': _shortcode,
        'Password': password,
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': amount.round(),
        'PartyA': phoneNumber,
        'PartyB': _shortcode,
        'PhoneNumber': phoneNumber,
        'CallBackURL': 'https://your-callback-url.com/callback',
        'AccountReference': accountReference,
        'TransactionDesc': transactionDesc,
      };

      final response = await http.post(
        Uri.parse('$_mpesaBaseUrl/mpesa/stkpush/v1/processrequest'),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return MpesaResponse.fromJson(data);
      } else {
        throw Exception('STK Push failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Payment initiation failed: $e');
    }
  }

  // Get M-Pesa Access Token
  Future<String> _getAccessToken() async {
    final credentials = base64Encode(utf8.encode('$_consumerKey:$_consumerSecret'));
    
    final response = await http.get(
      Uri.parse('$_mpesaBaseUrl/oauth/v1/generate?grant_type=client_credentials'),
      headers: {
        'Authorization': 'Basic $credentials',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['access_token'];
    } else {
      throw Exception('Failed to get access token: ${response.body}');
    }
  }

  // Query Transaction Status
  Future<TransactionStatus> queryTransactionStatus(String checkoutRequestId) async {
    try {
      final accessToken = await _getAccessToken();
      
      final requestBody = {
        'BusinessShortCode': _shortcode,
        'Password': base64Encode(utf8.encode('$_shortcode$_passkey')),
        'Timestamp': DateTime.now().toIso8601String(),
        'CheckoutRequestID': checkoutRequestId,
      };

      final response = await http.post(
        Uri.parse('$_mpesaBaseUrl/mpesa/stkpushquery/v1/query'),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return TransactionStatus.fromJson(data);
      } else {
        throw Exception('Query failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Transaction query failed: $e');
    }
  }
}

class MpesaResponse {
  final String merchantRequestID;
  final String checkoutRequestID;
  final String responseCode;
  final String responseDescription;
  final String customerMessage;

  MpesaResponse({
    required this.merchantRequestID,
    required this.checkoutRequestID,
    required this.responseCode,
    required this.responseDescription,
    required this.customerMessage,
  });

  factory MpesaResponse.fromJson(Map<String, dynamic> json) {
    return MpesaResponse(
      merchantRequestID: json['MerchantRequestID'] ?? '',
      checkoutRequestID: json['CheckoutRequestID'] ?? '',
      responseCode: json['ResponseCode'] ?? '',
      responseDescription: json['ResponseDescription'] ?? '',
      customerMessage: json['CustomerMessage'] ?? '',
    );
  }
}

class TransactionStatus {
  final String responseCode;
  final String responseDescription;
  final String merchantRequestID;
  final String checkoutRequestID;
  final String resultCode;
  final String resultDesc;

  TransactionStatus({
    required this.responseCode,
    required this.responseDescription,
    required this.merchantRequestID,
    required this.checkoutRequestID,
    required this.resultCode,
    required this.resultDesc,
  });

  factory TransactionStatus.fromJson(Map<String, dynamic> json) {
    return TransactionStatus(
      responseCode: json['ResponseCode'] ?? '',
      responseDescription: json['ResponseDescription'] ?? '',
      merchantRequestID: json['MerchantRequestID'] ?? '',
      checkoutRequestID: json['CheckoutRequestID'] ?? '',
      resultCode: json['ResultCode'] ?? '',
      resultDesc: json['ResultDesc'] ?? '',
    );
  }
}
