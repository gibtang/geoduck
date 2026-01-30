import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const firebaseUid = request.headers.get('x-firebase-uid');

    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestingUser = await User.findOne({ firebaseUid });

    if (!requestingUser || !requestingUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { tier } = await request.json();
    const params = await context.params;

    if (!tier || !['free', 'paid_tier_1', 'admin'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { tier },
      { new: true }
    ).select('firebaseUid email tier isAdmin lastExecutionAt createdAt');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user tier:', error);
    return NextResponse.json(
      { error: 'Failed to update user tier', details: error.message },
      { status: 500 }
    );
  }
}
