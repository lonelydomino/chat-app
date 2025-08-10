import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/database';
import { Chat, Message } from '@/models/index';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function DELETE(
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

    // Find the chat and verify user is a participant
    const chat = await Chat.findOne({ 
      _id: chatId, 
      participants: userId 
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    // For group chats, check if user is an admin or if it's the last participant
    if (chat.type === 'group') {
      const isAdmin = chat.admins.includes(userId);
      const participantCount = chat.participants.length;
      
      if (!isAdmin && participantCount > 1) {
        return NextResponse.json(
          { error: 'Only admins can delete group chats with multiple participants' },
          { status: 403 }
        );
      }
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId: chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    return NextResponse.json({ 
      message: 'Chat deleted successfully',
      deletedChatId: chatId 
    });

  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
