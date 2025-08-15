import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing:', {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET
      });
      return NextResponse.json(
        { error: 'Cloudinary configuration incomplete' },
        { status: 500 }
      );
    }

    console.log('✅ Cloudinary config check passed');

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const userId = decoded.userId;

    console.log('✅ Authentication verified for user:', userId);

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File; // Changed from 'image' to 'file'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('✅ File received:', { name: file.name, size: file.size, type: file.type });

    // Determine file type and validate
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isImage && !isAudio) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and audio files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for audio, 5MB for images)
    const maxSize = isAudio ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size too large. Maximum size is ${isAudio ? '10MB' : '5MB'}.` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('✅ File converted to buffer, size:', buffer.length);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `chat-app/${userId}/${uuidv4()}.${fileExtension}`;

    console.log('✅ Attempting Cloudinary upload for:', fileName);

    // Upload to Cloudinary with type-specific configuration
    const result = await new Promise((resolve, reject) => {
      const uploadOptions: any = {
        resource_type: isImage ? 'image' : 'video', // Cloudinary uses 'video' for audio files
        public_id: fileName,
        folder: 'chat-app',
      };

      // Add type-specific transformations
      if (isImage) {
        uploadOptions.transformation = [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Profile picture optimization
          { quality: 'auto', fetch_format: 'auto' } // Auto-optimize format and quality
        ];
      } else if (isAudio) {
        uploadOptions.transformation = [
          { audio_codec: 'mp3' }, // Convert to MP3 for better compatibility
          { quality: 'auto' } // Auto-optimize audio quality
        ];
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result);
            resolve(result);
          }
        }
      ).end(buffer);
    });

    console.log(`✅ File uploaded to Cloudinary: ${fileName}`);

    // Return the Cloudinary URL with file type info
    return NextResponse.json({ 
      success: true,
      fileUrl: (result as any).secure_url,
      fileName: fileName,
      publicId: (result as any).public_id,
      fileType: isImage ? 'image' : 'audio',
      duration: (result as any).duration, // Audio duration in seconds
      message: `${isImage ? 'Image' : 'Audio'} uploaded successfully to Cloudinary` 
    });

  } catch (error) {
    console.error('❌ Error uploading file to Cloudinary:', error);
    
    // Return more specific error information
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
