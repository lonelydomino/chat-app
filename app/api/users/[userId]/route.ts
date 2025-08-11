import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database';
import { User } from '@/models/index';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await connectMongoDB();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const currentUserId = decoded.userId;

    const { userId } = params;
    
    // Find the user by ID
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the current user is trying to view their own profile
    if (currentUserId === userId) {
      return NextResponse.json({ user });
    }

    // For other users, return only public information based on privacy settings
    const publicProfile = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      status: user.preferences?.privacy?.showStatus ? user.status : 'offline',
      lastSeen: user.preferences?.privacy?.showLastSeen ? user.lastSeen : null,
      bio: user.bio,
      displayName: user.displayName,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt
    };

    return NextResponse.json({ user: publicProfile });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
