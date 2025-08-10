import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database';
import { User } from '@/models/index';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
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
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build search query
    let query: any = {
      _id: { $ne: userId } // Exclude current user
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users excluding password
    const users = await User.find(query)
      .select('-password')
      .limit(limit)
      .sort({ username: 1 });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
