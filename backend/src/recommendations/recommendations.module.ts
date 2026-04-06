import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { GeminiService } from './gemini.service';
import { RecommendationsController } from './recommendations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, GeminiService],
  exports: [RecommendationsService, GeminiService],
})
export class RecommendationsModule {}
