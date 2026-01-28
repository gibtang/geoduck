import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IKeywordMention {
  keyword: Types.ObjectId;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
}

export interface IResult extends Document {
  prompt?: Types.ObjectId | null;
  llmModel: string;
  response: string;
  keywordsMentioned: IKeywordMention[];
  user: Types.ObjectId;
  createdAt: Date;
}

const KeywordMentionSchema = new Schema({
  keyword: {
    type: Schema.Types.ObjectId,
    ref: 'Keyword',
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
    keywordsMentioned: {
      type: [KeywordMentionSchema],
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
