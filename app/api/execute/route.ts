import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Keyword from '@/models/Keyword';
import Prompt from '@/models/Prompt';
import Result from '@/models/Result';
import { executePromptNonStreaming, AVAILABLE_MODELS } from '@/lib/openrouter';
import { detectKeywordMentions } from '@/lib/keywordDetection';

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

    const { promptId, model, promptContent, compareModels } = await request.json();

    if (!model) {
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

    const keywords = await Keyword.find({ user: user._id });

    // === DEBUG LOGGING ===
    console.log('\n=== LLM EXECUTION DEBUG ===');
    console.log('Primary model selected:', model);
    console.log('Comparison models:', compareModels);
    console.log('Comparison models count:', compareModels ? compareModels.length : 0);
    console.log('Expected total results:', compareModels ? compareModels.length + 1 : 1);
    console.log('=========================\n');
    // === END DEBUG LOGGING ===

    let results = [];

    if (compareModels && compareModels.length > 0) {
      console.log('🔍 BUG DETECTION: Executing ONLY comparison models, primary model IGNORED');
      for (const modelName of compareModels) {
        console.log(`  → Executing comparison model: ${modelName}`);
        const response = await executePromptNonStreaming(modelName, prompt);
        const fullResponse = await response.text;

        const keywordMentions = detectKeywordMentions(fullResponse, keywords);

        const result = await Result.create({
          prompt: promptDoc?._id || null,
          llmModel: modelName,
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
          model: modelName,
          response: fullResponse,
          keywordsMentioned: keywordMentions.map((km) => ({
            ...km,
            keywordId: km.keyword._id,
            keywordName: km.keyword.name,
          })),
          createdAt: result.createdAt,
        });
      }
    } else {
      console.log(`  → Executing primary model only: ${model}`);
      const response = await executePromptNonStreaming(model, prompt);
      const fullResponse = await response.text;

      const keywordMentions = detectKeywordMentions(fullResponse, keywords);

      const result = await Result.create({
        prompt: promptDoc?._id || null,
        llmModel: model,
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
        model,
        response: fullResponse,
        keywordsMentioned: keywordMentions.map((km) => ({
          ...km,
          keywordId: km.keyword._id,
          keywordName: km.keyword.name,
        })),
        createdAt: result.createdAt,
      });
    }

    // === DEBUG RESULTS ===
    console.log('\n=== EXECUTION RESULTS ===');
    console.log('Actual results created:', results.length);
    console.log('Models executed:', results.map(r => r.model));
    console.log('Expected vs Actual:', compareModels ? compareModels.length + 1 : 1, 'vs', results.length);
    if (results.length !== (compareModels ? compareModels.length + 1 : 1)) {
      console.log('❌ BUG CONFIRMED: Result count mismatch!');
    }
    console.log('========================\n');
    // === END DEBUG RESULTS ===

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
