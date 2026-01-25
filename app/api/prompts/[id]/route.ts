import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prompt from '@/models/Prompt';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const firebaseUid = request.headers.get('x-firebase-uid');

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const prompt = await Prompt.findOne({
      _id: id,
      user: user._id,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const firebaseUid = request.headers.get('x-firebase-uid');

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { title, content } = data;
    const { id } = await params;

    const prompt = await Prompt.findOneAndUpdate(
      {
        _id: id,
        user: user._id,
      },
      {
        title,
        content,
      },
      { new: true, runValidators: true }
    );

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const firebaseUid = request.headers.get('x-firebase-uid');

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const prompt = await Prompt.findOneAndDelete({
      _id: id,
      user: user._id,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
