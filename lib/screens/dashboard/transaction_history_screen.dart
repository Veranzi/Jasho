import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class Transactions extends StatelessWidget {
  const Transactions({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Transaction History", style: TextStyle(fontSize: 16.sp))),
      body: ListView(
        children: [
          ListTile(title: Text("Payment from Client A", style: TextStyle(fontSize: 14.sp)), subtitle: Text("KES 5000", style: TextStyle(fontSize: 12.sp))),
          ListTile(title: Text("Payment to Supplier X", style: TextStyle(fontSize: 14.sp)), subtitle: Text("KES 2000", style: TextStyle(fontSize: 12.sp))),
        ],
      ),
    );
  }
}
