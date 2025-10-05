import express, { Response } from 'express';
import multer from 'multer';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { AuthRequest, ErrorResponse } from '../types';

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.'));
    }
  }
});

// GET /api/profile - Get current user's profile
router.get('/', authenticate, async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve profile'
      }
    });
  }
});

// PUT /api/profile - Update current user's profile
router.put('/', authenticate, async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
  try {
    const { firstName, lastName, bio, phone, location, linkedin, website } = req.body;

    const updateData: any = {
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.bio': bio,
      'profile.phone': phone,
      'profile.location': location,
      'profile.linkedin': linkedin,
      'profile.website': website
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
});

// POST /api/profile/image - Upload profile image
router.post('/image', authenticate, upload.single('image'), async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'FIELD_REQUIRED',
          field: 'image',
          message: 'Image file is required'
        }
      });
    }

    // Convert image to base64 (in production, you'd upload to cloud storage)
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: { 'profile.profileImage': base64Image } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload profile image'
      }
    });
  }
});

// GET /api/profile/:id - Get user profile by ID (for public viewing)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response<ErrorResponse | any>) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Return public profile information
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        bio: user.profile?.bio,
        location: user.profile?.location,
        profileImage: user.profile?.profileImage,
        linkedin: user.profile?.linkedin,
        website: user.profile?.website
        // Don't expose phone for privacy
      },
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve profile'
      }
    });
  }
});

export default router;
