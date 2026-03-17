import { Body, Controller, Post } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { GenerateQuestionsDto } from './dtos/generate-questions.dto';
import { EvaluateAnswerDto } from './dtos/evaluate-answer.dto';
import { ConfidenceDto } from './dtos/confidence.dto';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('generate-questions')
  async generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return await this.interviewService.generateQuestions(dto);
  }

  @Post('evaluate-answer')
  async evaluateAnswer(@Body() dto: EvaluateAnswerDto) {
    return await this.interviewService.evaluateAnswer(dto);
  }

  @Post('confidence')
  async computeConfidence(@Body() dto: ConfidenceDto) {
    return await this.interviewService.computeConfidence(dto);
  }
}
