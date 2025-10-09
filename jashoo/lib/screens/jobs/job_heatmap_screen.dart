import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class JobHeatmapScreen extends ConsumerStatefulWidget {
  const JobHeatmapScreen({super.key});

  @override
  ConsumerState<JobHeatmapScreen> createState() => _JobHeatmapScreenState();
}

class _JobHeatmapScreenState extends ConsumerState<JobHeatmapScreen> {
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  final Set<Circle> _circles = {};
  String _selectedJobType = 'All';
  
  // Mock job data with locations
  final List<JobLocation> _jobLocations = [
    JobLocation(
      id: '1',
      title: 'Uber Driver',
      type: 'Transport',
      payRate: 500.0,
      location: const LatLng(-1.2921, 36.8219), // Nairobi CBD
      color: Colors.blue,
      demand: JobDemand.high,
    ),
    JobLocation(
      id: '2',
      title: 'Glovo Delivery',
      type: 'Delivery',
      payRate: 400.0,
      location: const LatLng(-1.2862, 36.8172), // Westlands
      color: Colors.green,
      demand: JobDemand.medium,
    ),
    JobLocation(
      id: '3',
      title: 'Bolt Driver',
      type: 'Transport',
      payRate: 450.0,
      location: const LatLng(-1.3048, 36.8150), // Eastleigh
      color: Colors.blue,
      demand: JobDemand.high,
    ),
    JobLocation(
      id: '4',
      title: 'Jumia Delivery',
      type: 'Delivery',
      payRate: 350.0,
      location: const LatLng(-1.2734, 36.8120), // Karen
      color: Colors.green,
      demand: JobDemand.low,
    ),
    JobLocation(
      id: '5',
      title: 'Freelance Writing',
      type: 'Remote',
      payRate: 800.0,
      location: const LatLng(-1.2921, 36.8219), // Nairobi CBD
      color: Colors.purple,
      demand: JobDemand.medium,
    ),
    JobLocation(
      id: '6',
      title: 'Cleaning Services',
      type: 'Service',
      payRate: 300.0,
      location: const LatLng(-1.2862, 36.8172), // Westlands
      color: Colors.orange,
      demand: JobDemand.high,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _updateMarkers();
  }

  void _updateMarkers() {
    _markers.clear();
    _circles.clear();

    final filteredJobs = _selectedJobType == 'All' 
        ? _jobLocations 
        : _jobLocations.where((job) => job.type == _selectedJobType).toList();

    for (final job in filteredJobs) {
      _markers.add(
        Marker(
          markerId: MarkerId(job.id),
          position: job.location,
          infoWindow: InfoWindow(
            title: job.title,
            snippet: 'KES ${job.payRate}/hour - ${job.demand.name} demand',
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(_getMarkerHue(job.color)),
        ),
      );

      // Add demand circle
      _circles.add(
        Circle(
          circleId: CircleId(job.id),
          center: job.location,
          radius: _getCircleRadius(job.demand),
          fillColor: job.color.withOpacity(0.2),
          strokeColor: job.color.withOpacity(0.5),
          strokeWidth: 2,
        ),
      );
    }
  }

  double _getCircleRadius(JobDemand demand) {
    switch (demand) {
      case JobDemand.high:
        return 500;
      case JobDemand.medium:
        return 300;
      case JobDemand.low:
        return 200;
    }
  }

  double _getMarkerHue(Color color) {
    if (color == Colors.blue) return BitmapDescriptor.hueBlue;
    if (color == Colors.green) return BitmapDescriptor.hueGreen;
    if (color == Colors.purple) return BitmapDescriptor.hueViolet;
    if (color == Colors.orange) return BitmapDescriptor.hueOrange;
    return BitmapDescriptor.hueRed;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A),
        title: const Text('Job Opportunities'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Job Type Filter
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _getJobTypes().length,
              itemBuilder: (context, index) {
                final jobType = _getJobTypes()[index];
                final isSelected = _selectedJobType == jobType;
                
                return Container(
                  margin: const EdgeInsets.only(right: 12, top: 12, bottom: 12),
                  child: FilterChip(
                    label: Text(jobType),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedJobType = jobType;
                        _updateMarkers();
                      });
                    },
                    selectedColor: const Color(0xFF1E3A8A).withOpacity(0.2),
                    checkmarkColor: const Color(0xFF1E3A8A),
                  ),
                );
              },
            ),
          ),
          
          // Map
          Expanded(
            child: GoogleMap(
              initialCameraPosition: const CameraPosition(
                target: LatLng(-1.2921, 36.8219), // Nairobi CBD
                zoom: 12,
              ),
              markers: _markers,
              circles: _circles,
              onMapCreated: (GoogleMapController controller) {
                _mapController = controller;
              },
              mapType: MapType.normal,
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
            ),
          ),
          
          // Legend
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Demand Legend',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildLegendItem(Colors.red, 'High Demand', 'Many opportunities'),
                    const SizedBox(width: 20),
                    _buildLegendItem(Colors.orange, 'Medium Demand', 'Some opportunities'),
                    const SizedBox(width: 20),
                    _buildLegendItem(Colors.green, 'Low Demand', 'Few opportunities'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String title, String subtitle) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B),
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ],
    );
  }

  List<String> _getJobTypes() {
    return ['All', 'Transport', 'Delivery', 'Remote', 'Service'];
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Jobs'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('All Jobs'),
              leading: Radio<String>(
                value: 'All',
                groupValue: _selectedJobType,
                onChanged: (value) {
                  setState(() {
                    _selectedJobType = value!;
                    _updateMarkers();
                  });
                  Navigator.of(context).pop();
                },
              ),
            ),
            ..._getJobTypes().skip(1).map((type) => ListTile(
              title: Text(type),
              leading: Radio<String>(
                value: type,
                groupValue: _selectedJobType,
                onChanged: (value) {
                  setState(() {
                    _selectedJobType = value!;
                    _updateMarkers();
                  });
                  Navigator.of(context).pop();
                },
              ),
            )),
          ],
        ),
      ),
    );
  }
}

class JobLocation {
  final String id;
  final String title;
  final String type;
  final double payRate;
  final LatLng location;
  final Color color;
  final JobDemand demand;

  JobLocation({
    required this.id,
    required this.title,
    required this.type,
    required this.payRate,
    required this.location,
    required this.color,
    required this.demand,
  });
}

enum JobDemand {
  high,
  medium,
  low,
}
