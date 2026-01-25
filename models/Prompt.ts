import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IPrompt extends Document {
  title: string;
  content: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PromptSchema.index({ user: 1 });

const Prompt: Model<IPrompt> = mongoose.models.Prompt || mongoose.model<IPrompt>('Prompt', PromptSchema);

export default Prompt;
