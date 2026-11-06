import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LIMITS } from '../common/security/throttle';
import { ChatMessageDto } from './dto/chat-message.dto';

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
  @ApiOperation({
    summary: 'Get personalized recommendations + AI message for current user',
  })
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
  @Throttle(LIMITS.aiChat)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat with the AI sports assistant (Gemini)' })
  async chat(@CurrentUser() user: any, @Body() body: ChatMessageDto) {
    // Solo nombre y rol activo: no se envían correo, DNI ni datos de salud a Gemini.
    const { response, aiAnswered } = await this.geminiService.chatWithAssistant(
      body.message,
      {
        name: user?.name,
        role: user?.role,
      },
    );
    return {
      response,
      // true solo si la respuesta vino realmente de la IA
      aiEnabled: aiAnswered,
    };
  }
}
