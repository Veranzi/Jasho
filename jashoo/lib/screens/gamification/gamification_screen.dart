import 'package:flutter/material.dart' hide Badge;
import 'package:provider/provider.dart';
import '../../providers/gamification_provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class GamificationScreen extends StatelessWidget {
  const GamificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final g = context.watch<GamificationProvider>();
    final int points = g.points;
    final int level = g.level;
    final double progressToNext = (points % 1000) / 1000.0;

    return Scaffold(
      appBar: AppBar(
        title: Image.asset('assets/logo1.png', height: 28),
        centerTitle: true,
        backgroundColor: const Color(0xFF10B981),
        actions: [
          IconButton(
            icon: const Icon(Icons.leaderboard),
            onPressed: () => Navigator.pushNamed(context, '/leaderboard'),
            tooltip: 'Leaderboard',
          ),
          IconButton(
            icon: const Icon(Icons.card_giftcard),
            onPressed: () => Navigator.pushNamed(context, '/rewards'),
            tooltip: 'Rewards',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HeaderCard(points: points, level: level, progressToNext: progressToNext, streakDays: g.loginStreakDays),
            const SizedBox(height: 16),
            _SectionTitle(title: 'Ways to earn points'),
            const SizedBox(height: 8),
            _EarnGrid(onSimulate: (value) => g.earnPoints(value)),
            const SizedBox(height: 16),
            _SectionTitle(title: 'Badges'),
            const SizedBox(height: 8),
            _BadgesStrip(badges: g.badges),
            const SizedBox(height: 16),
            _SectionTitle(title: 'Redeem quickly'),
            const SizedBox(height: 8),
            _RedeemQuick(onRedeem: (cost) => g.redeemPoints(cost), currentPoints: points),
            const SizedBox(height: 16),
            // Open Rewards Store and Simulate buttons in same row
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/rewards'),
                    icon: const Icon(Icons.store),
                    label: const Text('Open Rewards Store'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => g.earnPoints(100),
                    icon: const Icon(Icons.add),
                    label: const Text('Simulate +100'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  final int points;
  final int level;
  final double progressToNext;
  final int streakDays;

  const _HeaderCard({
    required this.points,
    required this.level,
    required this.progressToNext,
    required this.streakDays,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF34D399)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.stars, color: Colors.white, size: 28),
              const SizedBox(width: 8),
              Text('Level $level', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14.sp)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(999)),
                child: Row(
                  children: [
                    const Icon(Icons.local_fire_department, color: Colors.orangeAccent, size: 18),
                    const SizedBox(width: 6),
                    Text('${streakDays}d streak', style: TextStyle(color: Colors.white, fontSize: 12.sp)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text('$points pts', style: TextStyle(color: Colors.white, fontSize: 32.sp, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progressToNext.clamp(0.0, 1.0),
              minHeight: 8,
              color: Colors.lightGreenAccent,
              backgroundColor: Colors.white24,
            ),
          ),
          const SizedBox(height: 6),
          Text('Next level: ${(progressToNext * 100).toStringAsFixed(0)}%', style: TextStyle(color: Colors.white70, fontSize: 12.sp)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});
  @override
  Widget build(BuildContext context) {
    return Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold));
  }
}

class _EarnGrid extends StatelessWidget {
  final void Function(int value) onSimulate;
  const _EarnGrid({required this.onSimulate});

  @override
  Widget build(BuildContext context) {
    final items = [
      _EarnItem(Icons.login, 'Daily login', 5),
      _EarnItem(Icons.person_add_alt, 'Complete profile', 20),
      _EarnItem(Icons.send, 'Send money / pay bill', 10),
      _EarnItem(Icons.group_add, 'Refer a friend (verified)', 50),
      _EarnItem(Icons.handshake, 'Use partner services (ABSA)', 20),
      _EarnItem(Icons.work, 'Refer for jobs', 25),
      _EarnItem(Icons.savings, 'Save consistently (weekly bonus)', 5),
      _EarnItem(Icons.emoji_events, 'Hit milestones', 100),
      _EarnItem(Icons.security, 'Cybersecurity module', 30),
      _EarnItem(Icons.verified_user, 'Enable 2FA / II login', 15),
      _EarnItem(Icons.rate_review, 'Leave a review', 10),
      _EarnItem(Icons.feedback, 'Give feedback', 5),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        // Calculate responsive aspect ratio based on screen width
        double aspectRatio;
        int crossAxisCount;
        
        if (constraints.maxWidth < 400) {
          aspectRatio = 3.5; // Taller cards for narrow screens
          crossAxisCount = 2;
        } else if (constraints.maxWidth < 600) {
          aspectRatio = 3.2;
          crossAxisCount = 2;
        } else {
          aspectRatio = 2.8; // Shorter cards for wider screens
          crossAxisCount = 3; // More columns on wider screens
        }

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: aspectRatio,
          ),
          itemCount: items.length,
          itemBuilder: (_, i) {
            final it = items[i];
            return InkWell(
              onTap: () => onSimulate(it.points),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
                ),
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Row(
                      children: [
                        Icon(it.icon, color: Theme.of(context).colorScheme.primary, size: 18),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            it.title, 
                            maxLines: 2, 
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 10.sp),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '+${it.points} pts', 
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 10.sp,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _EarnItem {
  final IconData icon;
  final String title;
  final int points;
  _EarnItem(this.icon, this.title, this.points);
}

class _BadgesStrip extends StatelessWidget {
  final List<Badge> badges;
  const _BadgesStrip({required this.badges});

  @override
  Widget build(BuildContext context) {
    if (badges.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
        ),
        child: const Text('No badges yet — keep hustling!'),
      );
    }
    return SizedBox(
      height: 80,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: badges.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final b = badges[i];
          return Container(
            width: 200,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
            ),
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                const Icon(Icons.emoji_events, color: Colors.amber),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(b.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(b.description, maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }
}

class _RedeemQuick extends StatelessWidget {
  final void Function(int cost) onRedeem;
  final int currentPoints;
  const _RedeemQuick({required this.onRedeem, required this.currentPoints});

  @override
  Widget build(BuildContext context) {
    final items = const [
      {'name': 'Airtime 100MB', 'cost': 500, 'icon': Icons.network_cell},
      {'name': 'Txn fee discount', 'cost': 300, 'icon': Icons.discount},
      {'name': 'Gift voucher', 'cost': 700, 'icon': Icons.card_giftcard},
      {'name': 'Premium analytics', 'cost': 1200, 'icon': Icons.insights},
      {'name': 'Partner reward', 'cost': 900, 'icon': Icons.directions_bus},
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        double cardWidth;
        if (constraints.maxWidth < 400) {
          cardWidth = 180;
        } else if (constraints.maxWidth < 600) {
          cardWidth = 200;
        } else {
          cardWidth = 220;
        }

        return SizedBox(
          height: 120,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final r = items[i];
              final bool canRedeem = currentPoints >= (r['cost'] as int);
              return Container(
                width: cardWidth,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.2)),
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(r['icon'] as IconData, color: Theme.of(context).colorScheme.primary, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            r['name'].toString(), 
                            maxLines: 1, 
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Text('${r['cost']} pts', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        const Spacer(),
                        SizedBox(
                          height: 32,
                          child: ElevatedButton(
                            onPressed: canRedeem ? () => onRedeem(r['cost'] as int) : null,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            ),
                            child: const Text('Redeem', style: TextStyle(fontSize: 11)),
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}

