import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ErrorIds } from '@/constants/errorIds';

/**
 * Creates a new user in MongoDB or returns existing user if firebaseUid already exists
 *
 * @param request - Request body must contain:
 *   - firebaseUid: string (required) - Unique Firebase user identifier
 *   - email: string (required) - User's email address
 *
 * @returns JSON response:
 *   - 200: Existing user found
 *   - 201: New user created successfully
 *   - 400: Missing required fields
 *   - 409: User already exists with different email
 *   - 500: Server error
 *
 * @example
 * POST /api/users/create
 * Body: { "firebaseUid": "abc123", "email": "user@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { firebaseUid, email } = await request.json();

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { error: 'Firebase UID and email are required', errorId: ErrorIds.API_VALIDATION_ERROR },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ firebaseUid });

    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    const newUser = await User.create({
      firebaseUid,
      email: email.toLowerCase(),
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating user:', error);

    // Handle duplicate key errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'A user with this email already exists', errorId: ErrorIds.API_USER_CREATION_FAILED },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user', errorId: ErrorIds.API_USER_CREATION_FAILED },
      { status: 500 }
    );
  }
}
