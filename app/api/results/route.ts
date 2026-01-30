import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Result from '@/models/Result';
import User from '@/models/User';
import { getRetentionCutoff } from '@/lib/tierLimits';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Apply data retention filter
    const retentionCutoff = getRetentionCutoff(user);

    const results = await Result.find({
      user: user._id,
      createdAt: { $gte: retentionCutoff },
    })
      .populate('prompt')
      .populate('keywordsMentioned.keyword')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Result.countDocuments({
      user: user._id,
      createdAt: { $gte: retentionCutoff },
    });

    return NextResponse.json({ results, total });
  } catch (error: any) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
