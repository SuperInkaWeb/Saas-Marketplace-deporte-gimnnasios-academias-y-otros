import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Mensaje del chat de IA: acotado para no enviar textos enormes a Gemini (AUD-14)
export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
