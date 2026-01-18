import mongoose from 'mongoose';
import User from '@/models/User';
import { connect, closeDatabase, clearDatabase } from '../utils/mongodb';

describe('User Model', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should create a user with valid data', async () => {
    const userData = {
      firebaseUid: 'test-firebase-uid-123',
      email: 'test@example.com',
    };

    const user = await User.create(userData);

    expect(user.firebaseUid).toBe(userData.firebaseUid);
    expect(user.email).toBe(userData.email);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('should fail to create user without firebaseUid', async () => {
    const userData = {
      email: 'test@example.com',
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should fail to create user without email', async () => {
    const userData = {
      firebaseUid: 'test-uid',
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should fail to create user with duplicate firebaseUid', async () => {
    const userData = {
      firebaseUid: 'test-uid-123',
      email: 'test1@example.com',
    };

    await User.create(userData);

    const duplicateUser = {
      firebaseUid: 'test-uid-123',
      email: 'test2@example.com',
    };

    await expect(User.create(duplicateUser)).rejects.toThrow();
  });

  it('should fail to create user with duplicate email', async () => {
    const userData = {
      firebaseUid: 'test-uid-1',
      email: 'test@example.com',
    };

    await User.create(userData);

    const duplicateEmail = {
      firebaseUid: 'test-uid-2',
      email: 'test@example.com',
    };

    await expect(User.create(duplicateEmail)).rejects.toThrow();
  });

  it('should store email in lowercase', async () => {
    const userData = {
      firebaseUid: 'test-uid-123',
      email: 'TEST@EXAMPLE.COM',
    };

    const user = await User.create(userData);

    expect(user.email).toBe('test@example.com');
  });

  it('should find user by firebaseUid', async () => {
    const userData = {
      firebaseUid: 'test-uid-123',
      email: 'test@example.com',
    };

    await User.create(userData);

    const foundUser = await User.findOne({ firebaseUid: 'test-uid-123' });

    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe('test@example.com');
  });

  it('should find user by email', async () => {
    const userData = {
      firebaseUid: 'test-uid-123',
      email: 'test@example.com',
    };

    await User.create(userData);

    const foundUser = await User.findOne({ email: 'test@example.com' });

    expect(foundUser).toBeDefined();
    expect(foundUser?.firebaseUid).toBe('test-uid-123');
  });

  it('should update user email', async () => {
    const user = await User.create({
      firebaseUid: 'test-uid-123',
      email: 'old@example.com',
    });

    user.email = 'new@example.com';
    await user.save();

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.email).toBe('new@example.com');
  });

  it('should delete user', async () => {
    const user = await User.create({
      firebaseUid: 'test-uid-123',
      email: 'test@example.com',
    });

    await User.findByIdAndDelete(user._id);

    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it('should handle multiple users', async () => {
    await User.create({
      firebaseUid: 'uid-1',
      email: 'user1@example.com',
    });

    await User.create({
      firebaseUid: 'uid-2',
      email: 'user2@example.com',
    });

    await User.create({
      firebaseUid: 'uid-3',
      email: 'user3@example.com',
    });

    const users = await User.find({});

    expect(users).toHaveLength(3);
  });
});
