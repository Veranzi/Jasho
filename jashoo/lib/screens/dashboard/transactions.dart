import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  // Define colors and styles for consistency
  static const Color primaryColor = Color(0xFF0D47A1);
  static const Color pendingColor = Colors.blueAccent;

  // Dummy data for the transaction list
  final List<Map<String, dynamic>> _transactions = [
    {
      "service": "Safaricom Airtime",
      "companyId": "SAF",
      "mobileNo": "0700123456",
      "amount": "100",
      "date": "2025-09-15 08:15:10 AM",
      "status": "Success",
      "category": "Airtime",
      "currency": "KES",
    },
    {
      "service": "KPLC Electricity",
      "companyId": "KPLC",
      "mobileNo": "12345678",
      "amount": "1200",
      "date": "2025-09-14 03:53:34 PM",
      "status": "Pending",
      "category": "Electricity",
      "currency": "KES",
    },
    {
      "service": "Airtel Airtime",
      "companyId": "AIRTEL",
      "mobileNo": "0733123456",
      "amount": "200",
      "date": "2025-09-13 11:15:42 PM",
      "status": "Success",
      "category": "Airtime",
      "currency": "KES",
    },
    {
      "service": "Nairobi Water",
      "companyId": "NWSC",
      "mobileNo": "ACC-55421",
      "amount": "650",
      "date": "2025-09-12 10:10:30 PM",
      "status": "Success",
      "category": "Water",
      "currency": "KES",
    },
  ];

  // Selected filter date
  DateTime? _selectedDate;
  String? _selectedService;
  String? _selectedStatus;
  String? _selectedCategory;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: _buildAppBar(),
      body: _buildBody(),
      bottomNavigationBar: _buildCustomBottomNavigationBar(),
    );
  }

  // --- WIDGET BUILDER METHODS ---

  AppBar _buildAppBar() {
    return AppBar(
      backgroundColor: primaryColor,
      elevation: 0,
      title: const Text(
        "Transactions",
        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: OutlinedButton(
            onPressed: _exportAsPdf,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: BorderSide(color: Colors.white.withOpacity(0.5)),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text("Export PDF"),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: OutlinedButton(
            onPressed: () => Navigator.pushNamed(context, '/supportChat'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: BorderSide(color: Colors.white.withOpacity(0.5)),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text("Tickets"),
          ),
        ),
      ],
    );
  }

  Widget _buildBody() {
    // Filtered transactions
    List<Map<String, dynamic>> filteredTransactions = _transactions;
    if (_selectedDate != null) {
      filteredTransactions = filteredTransactions.where((tx) {
        final txDate = DateFormat("yyyy-MM-dd HH:mm:ss a")
            .parse(tx["date"].toString());
        return DateUtils.isSameDay(txDate, _selectedDate!);
      }).toList();
    }
    if (_selectedService != null) {
      filteredTransactions = filteredTransactions
          .where((tx) => tx['service'] == _selectedService)
          .toList();
    }
    if (_selectedStatus != null) {
      filteredTransactions = filteredTransactions
          .where((tx) => tx['status'] == _selectedStatus)
          .toList();
    }
    if (_selectedCategory != null) {
      filteredTransactions = filteredTransactions
          .where((tx) => tx['category'] == _selectedCategory)
          .toList();
    }

    return Column(
      children: [
        _buildWalletCard(),
        _buildFilterSection(),
        Expanded(
          child: filteredTransactions.isEmpty
              ? const Center(
                  child: Text("No transactions for this date."),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  itemCount: filteredTransactions.length,
                  itemBuilder: (context, index) {
                    return _buildTransactionCard(filteredTransactions[index]);
                  },
                ),
        ),
      ],
    );
  }

  Future<void> _exportAsPdf() async {
    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('Transaction History', style: pw.TextStyle(fontSize: 18)),
            pw.SizedBox(height: 8),
            ..._transactions.map((tx) => pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 4),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('${tx['service']} (${tx['companyId']})'),
                            pw.Text('${tx['mobileNo']} - ${tx['date']}'),
                          ]),
                      pw.Text('${tx['amount']} - ${tx['status']}'),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
    await Printing.layoutPdf(onLayout: (format) async => doc.save());
  }

  Widget _buildWalletCard() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      decoration: const BoxDecoration(
        color: primaryColor,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "WALLET BALANCE (as of Now)",
            style:
                TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "KES 12,500",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.qr_code_scanner, color: Colors.white),
                  const SizedBox(width: 10),
                  OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withOpacity(0.5)),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Text("MANAGE"),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () async {
                final pickedDate = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate ?? DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (pickedDate != null) {
                  setState(() {
                    _selectedDate = pickedDate;
                  });
                }
              },
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _selectedDate == null
                            ? "Today"
                            : DateFormat("yyyy-MM-dd").format(_selectedDate!),
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: primaryColor),
                      ),
                      const Icon(Icons.arrow_drop_down, color: primaryColor),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Container(height: 2, color: primaryColor),
                ],
              ),
            ),
          ),
          Expanded(
            child: DropdownButton<String>(
              hint: Text('Service', style: TextStyle(color: Colors.grey[600])),
              value: _selectedService,
              isExpanded: true,
              underline: const SizedBox(),
              items: _services
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
              onChanged: (v) => setState(() => _selectedService = v),
            ),
          ),
          Expanded(
            child: DropdownButton<String>(
              hint: Text('Status', style: TextStyle(color: Colors.grey[600])),
              value: _selectedStatus,
              isExpanded: true,
              underline: const SizedBox(),
              items: _statuses
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
              onChanged: (v) => setState(() => _selectedStatus = v),
            ),
          ),
          Expanded(
            child: DropdownButton<String>(
              hint: Text('Category', style: TextStyle(color: Colors.grey[600])),
              value: _selectedCategory,
              isExpanded: true,
              underline: const SizedBox(),
              items: _categories
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
              onChanged: (v) => setState(() => _selectedCategory = v),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(Map<String, dynamic> transaction) {
    bool isPending = transaction['status'] == 'Pending';
    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(transaction['service'],
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text("Company ID: ${transaction['companyId']}",
                          style: TextStyle(
                              color: Colors.grey[600], fontSize: 12)),
                      Text("Mobile No: ${transaction['mobileNo']}",
                          style: TextStyle(
                              color: Colors.grey[600], fontSize: 12)),
                    ],
                  ),
                ),
                Text("${transaction['currency'] ?? 'KES'} ${transaction['amount']}",
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Date: ${transaction['date']}",
                    style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                Row(
                  children: [
                    Text(
                      transaction['status'],
                      style: TextStyle(
                        color: isPending ? pendingColor : Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 4),
                    if (isPending)
                      const Icon(Icons.info_outline,
                          color: pendingColor, size: 16),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomBottomNavigationBar() {
    const int currentIndex = 2; // History is selected
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 10)
        ],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(Icons.home, "Home", 0, currentIndex),
            _buildNavItem(Icons.dashboard_rounded, "Dashboard", 1, currentIndex),
            _buildNavItem(Icons.history, "History", 2, currentIndex),
            _buildNavItem(Icons.person, "Profile", 3, currentIndex),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(
      IconData icon, String label, int index, int currentIndex) {
    final bool isSelected = currentIndex == index;
    return GestureDetector(
      onTap: () {
        // TODO: Handle navigation
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE3F2FD) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? primaryColor : Colors.grey[600],
              size: 26,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? primaryColor : Colors.grey[600],
                fontSize: 12,
                fontWeight:
                    isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<String> get _services => {
        for (final tx in _transactions) tx['service'] as String,
      }.toList();
  List<String> get _statuses => {
        for (final tx in _transactions) tx['status'] as String,
      }.toList();
  List<String> get _categories => {
        for (final tx in _transactions)
          if (tx['category'] != null) tx['category'] as String,
      }.toList();
}
