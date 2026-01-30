import mongoose, { Schema, Model, Document } from 'mongoose';

export type UserTier = 'free' | 'paid_tier_1' | 'admin';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  tier: UserTier;
  lastExecutionAt?: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tier: {
      type: String,
      enum: ['free', 'paid_tier_1', 'admin'],
      default: 'free',
      required: true,
    },
    lastExecutionAt: {
      type: Date,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
