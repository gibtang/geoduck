import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IKeyword extends Document {
  name: string;
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

const Keyword: Model<IKeyword> = mongoose.models.Keyword || mongoose.model<IKeyword>('Keyword', KeywordSchema);

export default Keyword;
