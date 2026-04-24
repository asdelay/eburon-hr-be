import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateQuestionsDto } from './dtos/generate-questions.dto';
import { EvaluateAnswerDto } from './dtos/evaluate-answer.dto';
import { ConfidenceDto } from './dtos/confidence.dto';

@Injectable()
export class InterviewService {
  private ai: GoogleGenAI;
  private model = 'gemini-3.1-flash-lite-preview';

  constructor(
    private config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateQuestions(
    dto: GenerateQuestionsDto,
  ): Promise<{ questions: string[] }> {
    const prompt = `You are an interviewer. The candidate is a "${dto.role}" with "${dto.experience} months" experience.

Generate exactly 5 interview questions to assess their technical knowledge and fit for the role. Questions should be appropriate for their stated level.

Return ONLY valid JSON in this exact format, no other text:
{"questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]}`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const text = response.text ?? '';
    const parsed = this.parseJson<{ questions: string[] }>(text);
    if (
      !parsed?.questions ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== 5
    ) {
      throw new Error('Invalid response from LLM: expected 5 questions');
    }
    return { questions: parsed.questions };
  }

  async evaluateAnswer(
    dto: EvaluateAnswerDto,
  ): Promise<{ feedback: string; confidenceDelta: number }> {
    const prompt = `You are evaluating an interview answer.

Role: ${dto.role}
Question: ${dto.question}
Answer: ${dto.answer}

Score this answer on a scale where:
- 0.0 = very poor / wrong / irrelevant
- 0.5 = weak but shows some understanding
- 1.0 = solid answer for the stated level
- 1.5 = strong answer
- 2.0 = excellent, above expectation

Return ONLY valid JSON in this exact format, no other text:
{"feedback": "Brief constructive feedback in 1-2 sentences", "confidenceDelta": 0.8}`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const text = response.text ?? '';
    const parsed = this.parseJson<{
      feedback: string;
      confidenceDelta: number;
    }>(text);
    if (
      !parsed ||
      typeof parsed.feedback !== 'string' ||
      typeof parsed.confidenceDelta !== 'number'
    ) {
      throw new Error(
        'Invalid response from LLM: expected feedback and confidenceDelta',
      );
    }
    return {
      feedback: parsed.feedback,
      confidenceDelta: parsed.confidenceDelta,
    };
  }

  async computeConfidence(
    dto: ConfidenceDto,
  ): Promise<{ confidence: number; label: string }> {
    const answersText = dto.answers
      .map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`)
      .join('\n\n');
    const exp = `${Math.floor(dto.experience / 12)} years ${dto.experience % 12 ? `and ${dto.experience % 12} months` : ''}`;
    const scoresText = dto.perAnswerScores
      ? dto.perAnswerScores
          .map((s, i) => `Q${i + 1}: ${s.confidenceDelta}`)
          .join(', ')
      : 'not provided';

    const prompt = `You are computing a final interview confidence score.

Candidate: ${dto.role} with ${exp} of experience.

Answers:
${answersText}

Per-question scores (0-2 scale): ${scoresText}

Compute the overall confidence (0-2):
- 0-1: Worse than expected for stated level
- 1: Solid match (e.g. solid junior)
- 1-2: Better than stated level (above junior)

Return ONLY valid JSON in this exact format, no other text:
{"confidence": 1.1, "label": "Solid junior with some growth areas"}`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const text = response.text ?? '';
    const parsed = this.parseJson<{ confidence: number; label: string }>(text);
    if (
      !parsed ||
      typeof parsed.confidence !== 'number' ||
      typeof parsed.label !== 'string'
    ) {
      throw new Error(
        'Invalid response from LLM: expected confidence and label',
      );
    }

    await this.prisma.interview.upsert({
      where: { userId: dto.candidateId },
      update: {
        confidence: parsed.confidence,
        label: parsed.label,
        questions: dto.answers.map((a) => a.question),
        answers: dto.answers.map((a) => a.answer),
      },
      create: {
        userId: dto.candidateId,
        confidence: parsed.confidence,
        label: parsed.label,
        questions: dto.answers.map((a) => a.question),
        answers: dto.answers.map((a) => a.answer),
      },
    });

    return { confidence: parsed.confidence, label: parsed.label };
  }

  private parseJson<T>(text: string): T | null {
    const trimmed = text.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return null;
    }
  }
}
