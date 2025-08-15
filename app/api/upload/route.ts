import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Temporary in-memory storage for development/testing
// In production, use cloud storage like AWS S3 or Cloudinary
if (!global.fileStorage) {
  global.fileStorage = new Map<string, { buffer: Buffer; type: string; name: string }>();
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convert file to buffer and store in memory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Store file in memory (temporary solution)
    global.fileStorage.set(fileName, {
      buffer,
      type: file.type,
      name: file.name
    });

    // Return the file URL
    const fileUrl = `/api/uploads/${fileName}`;

    console.log(`✅ File uploaded: ${fileName} (${file.size} bytes)`);

    return NextResponse.json({ 
      success: true,
      fileUrl,
      fileName,
      message: 'Image uploaded successfully' 
    });

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
