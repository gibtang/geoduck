import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IKeyword extends Document {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  keywords: string[];
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: false,
      min: 0,
    },
    keywords: {
      type: [String],
      default: [],
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

KeywordSchema.index({ user: 1, category: 1 });
KeywordSchema.index({ keywords: 1 });

const Keyword: Model<IKeyword> = mongoose.models.Keyword || mongoose.model<IKeyword>('Keyword', KeywordSchema);

export default Keyword;
