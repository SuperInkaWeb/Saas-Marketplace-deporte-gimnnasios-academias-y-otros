import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized recommendations + AI message for current user' })
  async getRecommendations(@CurrentUser() user: any) {
    const { recommendations, insights, userProfile } =
      await this.recommendationsService.getPersonalizedRecommendations(user.id);

    const aiMessage = await this.geminiService.generatePersonalizedMessage({
      userName: user.name,
      insights,
      topRecommendation: recommendations[0]?.title,
      totalReservations: userProfile.totalReservations,
    });

    return {
      aiMessage,
      aiEnabled: this.geminiService.enabled,
      insights,
      userProfile,
      recommendations,
    };
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat with the AI sports assistant (Gemini)' })
  async chat(
    @CurrentUser() user: any,
    @Body() body: { message: string },
  ) {
    const userContext = `Usuario: ${user.name}, Rol: ${user.role}`;
    const response = await this.geminiService.chatWithAssistant(body.message, userContext);
    return {
      response,
      aiEnabled: this.geminiService.enabled,
    };
  }
}
