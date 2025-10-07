const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateFileUpload } = require('../middleware/validation');
const { logger, DocumentScanner } = require('../middleware/cybersecurity');
const User = require('../models/User');

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-images/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${req.user.userId}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_PROFILE_IMAGE_SIZE) || 5242880, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Only JPG, PNG, and WebP are supported.`), false);
    }
  }
});

// Image processing class
class ImageProcessor {
  static async processProfileImage(inputPath, outputPath, userId) {
    try {
      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      
      // Validate image
      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Image too small. Minimum size is 100x100 pixels.');
      }
      
      if (metadata.width > 4000 || metadata.height > 4000) {
        throw new Error('Image too large. Maximum size is 4000x4000 pixels.');
      }
      
      // Process image with multiple sizes
      const sizes = [
        { name: 'original', width: Math.min(metadata.width, 1024), height: Math.min(metadata.height, 1024) },
        { name: 'large', width: 512, height: 512 },
        { name: 'medium', width: 256, height: 256 },
        { name: 'small', width: 128, height: 128 },
        { name: 'thumbnail', width: 64, height: 64 }
      ];
      
      const processedImages = {};
      
      for (const size of sizes) {
        const sizePath = outputPath.replace('.', `-${size.name}.`);
        
        await sharp(inputPath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 90 })
          .toFile(sizePath);
        
        processedImages[size.name] = {
          path: sizePath,
          width: size.width,
          height: size.height,
          size: fs.statSync(sizePath).size
        };
      }
      
      // Generate image hash for security
      const imageHash = await this.generateImageHash(inputPath);
      
      return {
        success: true,
        images: processedImages,
        metadata: {
          originalWidth: metadata.width,
          originalHeight: metadata.height,
          format: metadata.format,
          size: metadata.size,
          hash: imageHash
        }
      };
    } catch (error) {
      logger.error('Image processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  static async generateImageHash(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      return crypto.createHash('sha256').update(imageBuffer).digest('hex');
    } catch (error) {
      logger.error('Image hash generation error:', error);
      return null;
    }
  }
  
  static async validateImageSafety(imagePath) {
    try {
      const scanner = new DocumentScanner();
      const safetyCheck = await scanner.scanImage(imagePath);
      
      return {
        isSafe: safetyCheck.isSafe,
        metadata: safetyCheck.metadata,
        flaggedContent: safetyCheck.flaggedContent || []
      };
    } catch (error) {
      logger.error('Image safety validation error:', error);
      return {
        isSafe: false,
        error: error.message
      };
    }
  }
  
  static async extractImageMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels,
        space: metadata.space,
        depth: metadata.depth,
        isAnimated: metadata.pages > 1
      };
    } catch (error) {
      logger.error('Image metadata extraction error:', error);
      return null;
    }
  }
}

// Upload profile image - supports camera capture and file upload
router.post('/upload', authenticateToken, requireVerification, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile image file is required',
        code: 'IMAGE_FILE_REQUIRED'
      });
    }

    const userId = req.user.userId;
    const uploadedFile = req.file;
    
    logger.info('Profile image upload started', {
      userId,
      originalName: uploadedFile.originalname,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      ip: req.ip
    });

    // Validate image safety
    const safetyCheck = await ImageProcessor.validateImageSafety(uploadedFile.path);
    if (!safetyCheck.isSafe) {
      // Clean up uploaded file
      fs.unlinkSync(uploadedFile.path);
      
      return res.status(400).json({
        success: false,
        message: 'Image failed safety check',
        code: 'UNSAFE_IMAGE',
        details: safetyCheck.flaggedContent
      });
    }

    // Extract image metadata
    const imageMetadata = await ImageProcessor.extractImageMetadata(uploadedFile.path);
    if (!imageMetadata) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid image file',
        code: 'INVALID_IMAGE'
      });
    }

    // Process image (create multiple sizes)
    const processedImages = await ImageProcessor.processProfileImage(
      uploadedFile.path,
      uploadedFile.path.replace(path.extname(uploadedFile.path), '.jpg'),
      userId
    );

    if (!processedImages.success) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Image processing failed',
        code: 'PROCESSING_ERROR',
        error: processedImages.error
      });
    }

    // Get user and update profile image
    const user = await User.findById(userId);
    if (!user) {
      // Clean up files
      fs.unlinkSync(uploadedFile.path);
      Object.values(processedImages.images).forEach(img => {
        if (fs.existsSync(img.path)) fs.unlinkSync(img.path);
      });
      
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Remove old profile images if they exist
    if (user.kyc?.photoUrl) {
      await this.removeOldProfileImages(user.kyc.photoUrl);
    }

    // Update user profile with new image URLs
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const imageUrls = {};
    
    Object.entries(processedImages.images).forEach(([size, imageData]) => {
      imageUrls[size] = `${baseUrl}/uploads/profile-images/${path.basename(imageData.path)}`;
    });

    // Update user KYC with new photo
    user.kyc = user.kyc || {};
    user.kyc.photoUrl = imageUrls.medium; // Use medium size as default
    user.kyc.photoMetadata = {
      ...imageMetadata,
      processedAt: new Date(),
      sizes: imageUrls,
      hash: processedImages.metadata.hash
    };

    await user.save();

    // Clean up original uploaded file (keep processed versions)
    fs.unlinkSync(uploadedFile.path);

    logger.info('Profile image uploaded successfully', {
      userId,
      imageUrls,
      metadata: imageMetadata
    });

    // Return response in Flutter-compatible format
    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: {
          url: imageUrls.medium,
          thumbnail: imageUrls.thumbnail,
          large: imageUrls.large,
          original: imageUrls.original,
          metadata: {
            width: imageMetadata.width,
            height: imageMetadata.height,
            format: imageMetadata.format,
            size: imageMetadata.size,
            uploadedAt: new Date()
          }
        },
        user: {
          userId: user.userId,
          fullName: user.fullName,
          photoUrl: imageUrls.medium,
          isVerified: user.isVerified,
          verificationLevel: user.verificationLevel
        }
      }
    });

  } catch (error) {
    logger.error('Profile image upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'UPLOAD_ERROR'
    });
  }
});

// Get profile image
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { size = 'medium' } = req.query;

    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.kyc?.photoUrl) {
      return res.status(404).json({
        success: false,
        message: 'Profile image not found',
        code: 'IMAGE_NOT_FOUND'
      });
    }

    // Get image URL for requested size
    const imageUrl = user.kyc.photoMetadata?.sizes?.[size] || user.kyc.photoUrl;

    res.json({
      success: true,
      data: {
        profileImage: {
          url: imageUrl,
          userId: user.userId,
          fullName: user.fullName,
          metadata: user.kyc.photoMetadata
        }
      }
    });

  } catch (error) {
    logger.error('Get profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_IMAGE_ERROR'
    });
  }
});

// Delete profile image
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.kyc?.photoUrl) {
      return res.status(404).json({
        success: false,
        message: 'No profile image to delete',
        code: 'NO_IMAGE_TO_DELETE'
      });
    }

    // Remove image files
    await removeOldProfileImages(user.kyc.photoUrl);

    // Update user profile
    user.kyc.photoUrl = null;
    user.kyc.photoMetadata = null;
    await user.save();

    logger.info('Profile image deleted', {
      userId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Profile image deleted successfully',
      data: {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          photoUrl: null,
          isVerified: user.isVerified,
          verificationLevel: user.kyc?.idNumber ? 'kyc_verified' : user.verificationLevel
        }
      }
    });

  } catch (error) {
    logger.error('Delete profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DELETE_ERROR'
    });
  }
});

// Update profile image (replace existing)
router.put('/', authenticateToken, requireVerification, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile image file is required',
        code: 'IMAGE_FILE_REQUIRED'
      });
    }

    const userId = req.user.userId;
    const uploadedFile = req.file;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Remove old profile images if they exist
    if (user.kyc?.photoUrl) {
      await removeOldProfileImages(user.kyc.photoUrl);
    }

    // Process new image (same as upload)
    const safetyCheck = await ImageProcessor.validateImageSafety(uploadedFile.path);
    if (!safetyCheck.isSafe) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Image failed safety check',
        code: 'UNSAFE_IMAGE'
      });
    }

    const processedImages = await ImageProcessor.processProfileImage(
      uploadedFile.path,
      uploadedFile.path.replace(path.extname(uploadedFile.path), '.jpg'),
      userId
    );

    if (!processedImages.success) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Image processing failed',
        code: 'PROCESSING_ERROR',
        error: processedImages.error
      });
    }

    // Update user profile
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const imageUrls = {};
    
    Object.entries(processedImages.images).forEach(([size, imageData]) => {
      imageUrls[size] = `${baseUrl}/uploads/profile-images/${path.basename(imageData.path)}`;
    });

    const imageMetadata = await ImageProcessor.extractImageMetadata(uploadedFile.path);

    user.kyc = user.kyc || {};
    user.kyc.photoUrl = imageUrls.medium;
    user.kyc.photoMetadata = {
      ...imageMetadata,
      processedAt: new Date(),
      sizes: imageUrls,
      hash: processedImages.metadata.hash
    };

    await user.save();

    // Clean up original file
    fs.unlinkSync(uploadedFile.path);

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        profileImage: {
          url: imageUrls.medium,
          thumbnail: imageUrls.thumbnail,
          large: imageUrls.large,
          original: imageUrls.original,
          metadata: {
            width: imageMetadata.width,
            height: imageMetadata.height,
            format: imageMetadata.format,
            size: imageMetadata.size,
            updatedAt: new Date()
          }
        }
      }
    });

  } catch (error) {
    logger.error('Update profile image error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'UPDATE_ERROR'
    });
  }
});

// Helper function to remove old profile images
async function removeOldProfileImages(photoUrl) {
  try {
    if (!photoUrl) return;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const relativePath = photoUrl.replace(baseUrl, '').replace('/uploads/profile-images/', '');
    const baseFileName = relativePath.split('-')[0] + '-' + relativePath.split('-')[1]; // profile-userId

    const uploadDir = 'uploads/profile-images/';
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      const filesToDelete = files.filter(file => file.startsWith(baseFileName));
      
      filesToDelete.forEach(file => {
        const filePath = path.join(uploadDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  } catch (error) {
    logger.error('Error removing old profile images:', error);
  }
}

// Get image by size (serve static files)
router.get('/serve/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join('uploads/profile-images', filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
        code: 'IMAGE_NOT_FOUND'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    res.sendFile(path.resolve(imagePath));
  } catch (error) {
    logger.error('Serve image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve image',
      code: 'SERVE_ERROR'
    });
  }
});

// Validate image before upload (for Flutter preview)
router.post('/validate', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
        code: 'IMAGE_FILE_REQUIRED'
      });
    }

    const uploadedFile = req.file;

    // Validate image safety
    const safetyCheck = await ImageProcessor.validateImageSafety(uploadedFile.path);
    if (!safetyCheck.isSafe) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Image failed safety check',
        code: 'UNSAFE_IMAGE',
        details: safetyCheck.flaggedContent
      });
    }

    // Extract metadata
    const metadata = await ImageProcessor.extractImageMetadata(uploadedFile.path);
    
    // Clean up file
    fs.unlinkSync(uploadedFile.path);

    res.json({
      success: true,
      message: 'Image validation successful',
      data: {
        isValid: true,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size,
          hasAlpha: metadata.hasAlpha,
          isAnimated: metadata.isAnimated
        },
        recommendations: {
          optimalSize: metadata.width >= 256 && metadata.height >= 256,
          formatSupported: ['jpeg', 'png', 'webp'].includes(metadata.format),
          sizeAcceptable: metadata.size <= (parseInt(process.env.MAX_PROFILE_IMAGE_SIZE) || 5242880)
        }
      }
    });

  } catch (error) {
    logger.error('Image validation error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Image validation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'VALIDATION_ERROR'
    });
  }
});

module.exports = router;