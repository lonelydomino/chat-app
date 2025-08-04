import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
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
    const userId = decoded.userId;

    const { chatId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Check if user is participant in this chat
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    // Get messages with pagination
    const messages = await Message.find({ chatId })
      .populate('sender', 'username avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Decrypt message content
    const decryptedMessages = messages.map(message => {
      const messageObj = message.toObject();
      if (messageObj.content) {
        messageObj.content = message.decryptContent();
      }
      return messageObj;
    });

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ chatId });

    return NextResponse.json({
      messages: decryptedMessages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 