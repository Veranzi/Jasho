import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'api_service.dart';

class ImageService {
  static final ImageService _instance = ImageService._internal();
  factory ImageService() => _instance;
  ImageService._internal();

  final ImagePicker _picker = ImagePicker();
  final ApiService _apiService = ApiService();

  // Pick image from camera or gallery
  Future<XFile?> pickImage({
    ImageSource source = ImageSource.gallery,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
  }) async {
    try {
      return await _picker.pickImage(
        source: source,
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        imageQuality: imageQuality ?? 90,
      );
    } catch (e) {
      throw ImageServiceException('Failed to pick image: ${e.toString()}');
    }
  }

  // Pick multiple images
  Future<List<XFile>> pickMultipleImages({
    int maxImages = 5,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
  }) async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        imageQuality: imageQuality ?? 90,
      );
      
      if (images.length > maxImages) {
        throw ImageServiceException('Maximum $maxImages images allowed');
      }
      
      return images;
    } catch (e) {
      throw ImageServiceException('Failed to pick images: ${e.toString()}');
    }
  }

  // Validate image before upload
  Future<ImageValidationResult> validateImage(XFile imageFile) async {
    try {
      final file = File(imageFile.path);
      
      // Check file size (5MB limit)
      final fileSize = await file.length();
      if (fileSize > 5 * 1024 * 1024) {
        return ImageValidationResult(
          isValid: false,
          error: 'Image size exceeds 5MB limit',
        );
      }

      // Check file extension
      final extension = path.extension(imageFile.path).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].contains(extension)) {
        return ImageValidationResult(
          isValid: false,
          error: 'Unsupported image format. Only JPG, PNG, and WebP are allowed.',
        );
      }

      // Validate with backend
      final response = await _apiService.validateImage(imageFile: file);
      
      if (response['success'] == true) {
        final data = response['data'];
        return ImageValidationResult(
          isValid: true,
          metadata: ImageMetadata(
            width: data['metadata']['width'],
            height: data['metadata']['height'],
            format: data['metadata']['format'],
            size: data['metadata']['size'],
            hasAlpha: data['metadata']['hasAlpha'],
            isAnimated: data['metadata']['isAnimated'],
          ),
          recommendations: ImageRecommendations(
            optimalSize: data['recommendations']['optimalSize'],
            formatSupported: data['recommendations']['formatSupported'],
            sizeAcceptable: data['recommendations']['sizeAcceptable'],
          ),
        );
      } else {
        return ImageValidationResult(
          isValid: false,
          error: response['message'] ?? 'Image validation failed',
        );
      }
    } catch (e) {
      return ImageValidationResult(
        isValid: false,
        error: 'Validation error: ${e.toString()}',
      );
    }
  }

  // Upload profile image
  Future<ProfileImageResult> uploadProfileImage({
    required XFile imageFile,
    bool validateFirst = true,
  }) async {
    try {
      final file = File(imageFile.path);
      
      // Validate image first if requested
      if (validateFirst) {
        final validation = await validateImage(imageFile);
        if (!validation.isValid) {
          return ProfileImageResult(
            success: false,
            error: validation.error,
          );
        }
      }

      // Upload to backend
      final response = await _apiService.uploadProfileImage(imageFile: file);
      
      if (response['success'] == true) {
        final data = response['data'];
        final profileImage = data['profileImage'];
        final user = data['user'];
        
        return ProfileImageResult(
          success: true,
          profileImage: ProfileImage(
            url: profileImage['url'],
            thumbnail: profileImage['thumbnail'],
            large: profileImage['large'],
            original: profileImage['original'],
            metadata: ImageMetadata(
              width: profileImage['metadata']['width'],
              height: profileImage['metadata']['height'],
              format: profileImage['metadata']['format'],
              size: profileImage['metadata']['size'],
              uploadedAt: DateTime.parse(profileImage['metadata']['uploadedAt']),
            ),
          ),
          user: UserProfile(
            userId: user['userId'],
            fullName: user['fullName'],
            photoUrl: user['photoUrl'],
            isVerified: user['isVerified'],
            verificationLevel: user['verificationLevel'],
          ),
        );
      } else {
        return ProfileImageResult(
          success: false,
          error: response['message'] ?? 'Upload failed',
        );
      }
    } catch (e) {
      return ProfileImageResult(
        success: false,
        error: 'Upload error: ${e.toString()}',
      );
    }
  }

  // Update profile image
  Future<ProfileImageResult> updateProfileImage({
    required XFile imageFile,
    bool validateFirst = true,
  }) async {
    try {
      final file = File(imageFile.path);
      
      // Validate image first if requested
      if (validateFirst) {
        final validation = await validateImage(imageFile);
        if (!validation.isValid) {
          return ProfileImageResult(
            success: false,
            error: validation.error,
          );
        }
      }

      // Update on backend
      final response = await _apiService.updateProfileImage(imageFile: file);
      
      if (response['success'] == true) {
        final data = response['data'];
        final profileImage = data['profileImage'];
        
        return ProfileImageResult(
          success: true,
          profileImage: ProfileImage(
            url: profileImage['url'],
            thumbnail: profileImage['thumbnail'],
            large: profileImage['large'],
            original: profileImage['original'],
            metadata: ImageMetadata(
              width: profileImage['metadata']['width'],
              height: profileImage['metadata']['height'],
              format: profileImage['metadata']['format'],
              size: profileImage['metadata']['size'],
              uploadedAt: DateTime.parse(profileImage['metadata']['updatedAt']),
            ),
          ),
        );
      } else {
        return ProfileImageResult(
          success: false,
          error: response['message'] ?? 'Update failed',
        );
      }
    } catch (e) {
      return ProfileImageResult(
        success: false,
        error: 'Update error: ${e.toString()}',
      );
    }
  }

  // Get profile image
  Future<ProfileImage?> getProfileImage({
    required String userId,
    String size = 'medium',
  }) async {
    try {
      final response = await _apiService.getProfileImage(
        userId: 'user123', // Placeholder, replace with actual user ID from auth provider
        size: size,
      );
      
      if (response['success'] == true) {
        final data = response['data'];
        final profileImage = data['profileImage'];
        
        return ProfileImage(
          url: profileImage['url'],
          thumbnail: profileImage['metadata']?['sizes']?['thumbnail'],
          large: profileImage['metadata']?['sizes']?['large'],
          original: profileImage['metadata']?['sizes']?['original'],
          metadata: ImageMetadata(
            width: profileImage['metadata']?['width'],
            height: profileImage['metadata']?['height'],
            format: profileImage['metadata']?['format'],
            size: profileImage['metadata']?['size'],
          ),
        );
      }
      
      return null;
    } catch (e) {
      throw ImageServiceException('Failed to get profile image: ${e.toString()}');
    }
  }

  // Delete profile image
  Future<bool> deleteProfileImage() async {
    try {
      final response = await _apiService.deleteProfileImage();
      return response['success'] == true;
    } catch (e) {
      throw ImageServiceException('Failed to delete profile image: ${e.toString()}');
    }
  }

  // Compress image for better performance
  Future<File> compressImage({
    required XFile imageFile,
    int quality = 85,
    int maxWidth = 1024,
    int maxHeight = 1024,
  }) async {
    try {
      final file = File(imageFile.path);
      final tempDir = await getTemporaryDirectory();
      final compressedPath = path.join(
        tempDir.path,
        'compressed_${path.basename(imageFile.path)}',
      );
      
      // For now, just copy the file (in production, use image compression library)
      final compressedFile = await file.copy(compressedPath);
      
      return compressedFile;
    } catch (e) {
      throw ImageServiceException('Failed to compress image: ${e.toString()}');
    }
  }

  // Get image size in MB
  Future<double> getImageSizeInMB(XFile imageFile) async {
    try {
      final file = File(imageFile.path);
      final bytes = await file.length();
      return bytes / (1024 * 1024);
    } catch (e) {
      throw ImageServiceException('Failed to get image size: ${e.toString()}');
    }
  }

  // Check if image is too large
  Future<bool> isImageTooLarge(XFile imageFile, {double maxSizeMB = 5.0}) async {
    try {
      final sizeMB = await getImageSizeInMB(imageFile);
      return sizeMB > maxSizeMB;
    } catch (e) {
      return true; // Assume too large if we can't check
    }
  }

  // Get supported image formats
  List<String> getSupportedFormats() {
    return ['jpg', 'jpeg', 'png', 'webp'];
  }

  // Get maximum file size in MB
  double getMaxFileSizeMB() {
    return 5.0;
  }
}

// Data classes for image service
class ImageValidationResult {
  final bool isValid;
  final String? error;
  final ImageMetadata? metadata;
  final ImageRecommendations? recommendations;

  ImageValidationResult({
    required this.isValid,
    this.error,
    this.metadata,
    this.recommendations,
  });
}

class ImageMetadata {
  final int? width;
  final int? height;
  final String? format;
  final int? size;
  final bool? hasAlpha;
  final bool? isAnimated;
  final DateTime? uploadedAt;

  ImageMetadata({
    this.width,
    this.height,
    this.format,
    this.size,
    this.hasAlpha,
    this.isAnimated,
    this.uploadedAt,
  });
}

class ImageRecommendations {
  final bool optimalSize;
  final bool formatSupported;
  final bool sizeAcceptable;

  ImageRecommendations({
    required this.optimalSize,
    required this.formatSupported,
    required this.sizeAcceptable,
  });
}

class ProfileImageResult {
  final bool success;
  final String? error;
  final ProfileImage? profileImage;
  final UserProfile? user;

  ProfileImageResult({
    required this.success,
    this.error,
    this.profileImage,
    this.user,
  });
}

class ProfileImage {
  final String url;
  final String? thumbnail;
  final String? large;
  final String? original;
  final ImageMetadata metadata;

  ProfileImage({
    required this.url,
    this.thumbnail,
    this.large,
    this.original,
    required this.metadata,
  });
}

class UserProfile {
  final String userId;
  final String fullName;
  final String? photoUrl;
  final bool isVerified;
  final String verificationLevel;

  UserProfile({
    required this.userId,
    required this.fullName,
    this.photoUrl,
    required this.isVerified,
    required this.verificationLevel,
  });
}

class ImageServiceException implements Exception {
  final String message;
  
  ImageServiceException(this.message);
  
  @override
  String toString() => 'ImageServiceException: $message';
}