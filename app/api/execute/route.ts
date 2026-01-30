import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';
import Prompt from '@/models/Prompt';
import Result from '@/models/Result';
import { executePromptNonStreaming, AVAILABLE_MODELS } from '@/lib/openrouter';
import { detectKeywordMentions } from '@/lib/keywordDetection';
import { canExecute, formatRetryAfter } from '@/lib/tierLimits';

export async function POST(request: NextRequest) {
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

    // Check rate limit
    const rateLimitCheck = canExecute(user);
    if (!rateLimitCheck.allowed) {
      const retryAfter = rateLimitCheck.retryAfter!;
      const timeUntilRetry = formatRetryAfter(retryAfter);
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can execute your next prompt in ${timeUntilRetry}.`,
          retryAfter: retryAfter.toISOString(),
        },
        { status: 429 }
      );
    }

    const { promptId, llmModel, promptContent, comparisonModels, selectedKeywordIds } = await request.json();

    if (!llmModel) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    let prompt = '';
    let promptDoc = null;

    if (promptId) {
      promptDoc = await Prompt.findOne({
        _id: promptId,
        user: user._id,
      });

      if (!promptDoc) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        );
      }

      prompt = promptDoc.content;
    } else if (promptContent) {
      prompt = promptContent;
    } else {
      return NextResponse.json(
        { error: 'Prompt ID or content is required' },
        { status: 400 }
      );
    }

    let keywords = await Keyword.find({ user: user._id });

    // Filter to only selected keywords if provided
    if (selectedKeywordIds && selectedKeywordIds.length > 0) {
      keywords = keywords.filter(k => selectedKeywordIds.includes(k._id.toString()));
    }

    // === DEBUG LOGGING ===
    console.log('\n=== LLM EXECUTION DEBUG ===');
    console.log('Primary model:', llmModel);
    console.log('Comparison models:', comparisonModels);
    console.log('Comparison models count:', comparisonModels ? comparisonModels.length : 0);
    console.log('Keywords to detect:', keywords.length);
    console.log('Expected total results:', comparisonModels ? comparisonModels.length + 1 : 1);
    console.log('=========================\n');
    // === END DEBUG LOGGING ===

    let results = [];

    // ALWAYS execute primary model first
    console.log(`  → Executing primary model: ${llmModel}`);
    const response = await executePromptNonStreaming(llmModel, prompt);
    const fullResponse = await response.text;

    const keywordMentions = detectKeywordMentions(fullResponse, keywords);

    const result = await Result.create({
      prompt: promptDoc?._id || null,
      llmModel: llmModel,
      response: fullResponse,
      keywordsMentioned: keywordMentions.map((mention) => ({
        keyword: mention.keyword._id,
        position: mention.position,
        sentiment: mention.sentiment,
        context: mention.context,
      })),
      user: user._id,
    });

    results.push({
      _id: result._id,
      llmModel,
      response: fullResponse,
      keywordsMentioned: keywordMentions.map((km) => ({
        ...km,
        keywordId: km.keyword._id,
        keywordName: km.keyword.name,
      })),
      createdAt: result.createdAt,
    });

    // THEN execute comparison models if provided
    if (comparisonModels && comparisonModels.length > 0) {
      console.log('  → Executing comparison models:', comparisonModels);
      for (const modelName of comparisonModels) {
        console.log(`    → Executing: ${modelName}`);
        const compResponse = await executePromptNonStreaming(modelName, prompt);
        const compFullResponse = await compResponse.text;

        const compKeywordMentions = detectKeywordMentions(compFullResponse, keywords);

        const compResult = await Result.create({
          prompt: promptDoc?._id || null,
          llmModel: modelName,
          response: compFullResponse,
          keywordsMentioned: compKeywordMentions.map((mention) => ({
            keyword: mention.keyword._id,
            position: mention.position,
            sentiment: mention.sentiment,
            context: mention.context,
          })),
          user: user._id,
        });

        results.push({
          _id: compResult._id,
          llmModel: modelName,
          response: compFullResponse,
          keywordsMentioned: compKeywordMentions.map((km) => ({
            ...km,
            keywordId: km.keyword._id,
            keywordName: km.keyword.name,
          })),
          createdAt: compResult.createdAt,
        });
      }
    }

    // === DEBUG RESULTS ===
    console.log('\n=== EXECUTION RESULTS ===');
    console.log('Actual results created:', results.length);
    console.log('Models executed:', results.map(r => r.llmModel));
    console.log('Expected vs Actual:', comparisonModels ? comparisonModels.length + 1 : 1, 'vs', results.length);
    if (results.length !== (comparisonModels ? comparisonModels.length + 1 : 1)) {
      console.log('❌ BUG CONFIRMED: Result count mismatch!');
    }
    console.log('========================\n');
    // === END DEBUG RESULTS ===

    // Update user's last execution time
    await User.findByIdAndUpdate(user._id, { lastExecutionAt: new Date() });

    return NextResponse.json({ results }, { status: 201 });
  } catch (error: any) {
    console.error('Error executing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to execute prompt', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
