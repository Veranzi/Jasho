# Profile Image API Documentation

## Overview
The Profile Image API provides comprehensive image management functionality for user profiles, supporting camera capture, file upload, image processing, and security scanning.

## Base URL
```
http://localhost:3000/api/profile-image
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Upload Profile Image
**POST** `/upload`

Upload a new profile image (supports camera capture and file selection).

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `profileImage` (file): Image file (JPG, PNG, WebP)
  - Max size: 5MB
  - Supported formats: JPG, JPEG, PNG, WebP

#### Response
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "profileImage": {
      "url": "http://localhost:3000/uploads/profile-images/profile-user123-medium.jpg",
      "thumbnail": "http://localhost:3000/uploads/profile-images/profile-user123-thumbnail.jpg",
      "large": "http://localhost:3000/uploads/profile-images/profile-user123-large.jpg",
      "original": "http://localhost:3000/uploads/profile-images/profile-user123-original.jpg",
      "metadata": {
        "width": 1024,
        "height": 1024,
        "format": "jpeg",
        "size": 245760,
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    },
    "user": {
      "userId": "user123",
      "fullName": "John Doe",
      "photoUrl": "http://localhost:3000/uploads/profile-images/profile-user123-medium.jpg",
      "isVerified": true,
      "verificationLevel": "fully_verified"
    }
  }
}
```

#### Flutter Integration
```dart
// Using image_picker package
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';

class ProfileImageService {
  Future<Map<String, dynamic>> uploadProfileImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.camera, // or ImageSource.gallery
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 90,
    );

    if (image == null) return {'success': false, 'message': 'No image selected'};

    var request = http.MultipartRequest(
      'POST',
      Uri.parse('http://localhost:3000/api/profile-image/upload'),
    );

    request.headers['Authorization'] = 'Bearer $jwtToken';
    request.files.add(await http.MultipartFile.fromPath(
      'profileImage',
      image.path,
    ));

    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    
    return jsonDecode(responseData);
  }
}
```

### 2. Update Profile Image
**PUT** `/`

Replace existing profile image with a new one.

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `profileImage` (file): New image file

#### Response
Same as upload endpoint.

### 3. Get Profile Image
**GET** `/:userId`

Get profile image for a specific user.

#### Parameters
- `userId` (path): User ID
- `size` (query, optional): Image size (`thumbnail`, `small`, `medium`, `large`, `original`)
  - Default: `medium`

#### Response
```json
{
  "success": true,
  "data": {
    "profileImage": {
      "url": "http://localhost:3000/uploads/profile-images/profile-user123-medium.jpg",
      "userId": "user123",
      "fullName": "John Doe",
      "metadata": {
        "width": 1024,
        "height": 1024,
        "format": "jpeg",
        "size": 245760,
        "processedAt": "2024-01-15T10:30:00.000Z",
        "sizes": {
          "original": "http://localhost:3000/uploads/profile-images/profile-user123-original.jpg",
          "large": "http://localhost:3000/uploads/profile-images/profile-user123-large.jpg",
          "medium": "http://localhost:3000/uploads/profile-images/profile-user123-medium.jpg",
          "small": "http://localhost:3000/uploads/profile-images/profile-user123-small.jpg",
          "thumbnail": "http://localhost:3000/uploads/profile-images/profile-user123-thumbnail.jpg"
        },
        "hash": "a1b2c3d4e5f6..."
      }
    }
  }
}
```

### 4. Delete Profile Image
**DELETE** `/`

Remove current profile image.

#### Response
```json
{
  "success": true,
  "message": "Profile image deleted successfully",
  "data": {
    "user": {
      "userId": "user123",
      "fullName": "John Doe",
      "photoUrl": null,
      "isVerified": true,
      "verificationLevel": "kyc_verified"
    }
  }
}
```

### 5. Validate Image
**POST** `/validate`

Validate image before upload (useful for Flutter preview).

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `profileImage` (file): Image file to validate

#### Response
```json
{
  "success": true,
  "message": "Image validation successful",
  "data": {
    "isValid": true,
    "metadata": {
      "width": 1024,
      "height": 1024,
      "format": "jpeg",
      "size": 245760,
      "hasAlpha": false,
      "isAnimated": false
    },
    "recommendations": {
      "optimalSize": true,
      "formatSupported": true,
      "sizeAcceptable": true
    }
  }
}
```

### 6. Serve Image
**GET** `/serve/:filename`

Serve image files directly (for displaying in Flutter).

#### Parameters
- `filename` (path): Image filename

#### Response
- **Content-Type**: `image/jpeg`
- **Cache-Control**: `public, max-age=31536000`

## Image Processing

### Automatic Processing
When an image is uploaded, the system automatically:

1. **Validates** image format and size
2. **Scans** for malware and inappropriate content
3. **Processes** into multiple sizes:
   - Original (max 1024x1024)
   - Large (512x512)
   - Medium (256x256) - Default
   - Small (128x128)
   - Thumbnail (64x64)
4. **Optimizes** for web delivery
5. **Generates** SHA-256 hash for security
6. **Stores** metadata in database

### Security Features
- **Content Scanning**: AI-powered malware detection
- **Format Validation**: Only safe image formats allowed
- **Size Limits**: Prevents oversized uploads
- **Hash Verification**: Cryptographic integrity checking
- **Access Control**: User-specific image access

## Error Responses

### Common Error Codes
- `IMAGE_FILE_REQUIRED`: No image file provided
- `UNSAFE_IMAGE`: Image failed security scan
- `INVALID_IMAGE`: Unsupported format or corrupted file
- `PROCESSING_ERROR`: Image processing failed
- `UPLOAD_ERROR`: General upload failure
- `USER_NOT_FOUND`: User doesn't exist
- `IMAGE_NOT_FOUND`: Image doesn't exist

### Example Error Response
```json
{
  "success": false,
  "message": "Image failed safety check",
  "code": "UNSAFE_IMAGE",
  "details": ["malware_pattern_detected"]
}
```

## Flutter Widget Example

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ProfileImageWidget extends StatelessWidget {
  final String? imageUrl;
  final String userId;
  final VoidCallback? onTap;

  const ProfileImageWidget({
    Key? key,
    this.imageUrl,
    required this.userId,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey.shade300, width: 2),
        ),
        child: ClipOval(
          child: imageUrl != null
              ? CachedNetworkImage(
                  imageUrl: imageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => CircularProgressIndicator(),
                  errorWidget: (context, url, error) => Icon(
                    Icons.person,
                    size: 50,
                    color: Colors.grey,
                  ),
                )
              : Icon(
                  Icons.person,
                  size: 50,
                  color: Colors.grey,
                ),
        ),
      ),
    );
  }
}
```

## Best Practices

### For Flutter Developers
1. **Use image_picker** for camera/gallery access
2. **Validate images** before upload using `/validate` endpoint
3. **Cache images** using cached_network_image package
4. **Handle errors** gracefully with user-friendly messages
5. **Show progress** during upload process
6. **Compress images** before upload for better performance

### For Backend Integration
1. **Always validate** file types and sizes
2. **Implement security scanning** for all uploads
3. **Use CDN** for production image serving
4. **Monitor storage** usage and implement cleanup
5. **Log all** image operations for audit trails

## Rate Limits
- Upload: 5 requests per minute per user
- Validation: 10 requests per minute per user
- Get/Serve: 100 requests per minute per user

## File Storage
- **Local Development**: `uploads/profile-images/`
- **Production**: Configure cloud storage (AWS S3, Google Cloud, etc.)
- **Cleanup**: Old images are automatically removed when replaced