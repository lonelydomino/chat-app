import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database';
import { Chat, Message } from '@/models/index';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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

    // Get user's chats with populated participants and last message
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'username avatar status lastSeen')
      .populate('admins', 'username')
      .populate('lastMessage.sender', 'username avatar')
      .sort({ updatedAt: -1 });

    // Get unread message counts for each chat
    const chatsWithUnreadCounts = await Promise.all(
      chats.map(async (chat: any) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        });

        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    return NextResponse.json({ chats: chatsWithUnreadCounts });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { type, participants, name } = await request.json();

    if (!type || !participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Add current user to participants if not already included
    const allParticipants = participants.includes(userId) 
      ? participants 
      : [...participants, userId];

    // For direct chats, check if chat already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: allParticipants.length }
      });

      if (existingChat) {
        return NextResponse.json({ chat: existingChat });
      }
    }

    // Create new chat
    const chat = new Chat({
      type,
      participants: allParticipants,
      admins: type === 'group' ? [userId] : [],
      name: type === 'group' ? name : undefined
    });

    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'username avatar status lastSeen')
      .populate('admins', 'username');

    return NextResponse.json({ chat: populatedChat });

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 