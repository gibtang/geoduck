import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IProductMention {
  product: Types.ObjectId;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
}

export interface IResult extends Document {
  prompt?: Types.ObjectId | null;
  llmModel: string;
  response: string;
  productsMentioned: IProductMention[];
  user: Types.ObjectId;
  createdAt: Date;
}

const ProductMentionSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },
  context: {
    type: String,
    required: true,
  },
});

const ResultSchema: Schema = new Schema(
  {
    prompt: {
      type: Schema.Types.ObjectId,
      ref: 'Prompt',
      required: false,
    },
    llmModel: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    productsMentioned: {
      type: [ProductMentionSchema],
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
    createdAt: true,
    updatedAt: false,
  }
);

ResultSchema.index({ user: 1, prompt: 1 });
ResultSchema.index({ user: 1, llmModel: 1 });

const Result: Model<IResult> = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);

export default Result;
