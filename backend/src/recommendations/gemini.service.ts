import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { buildSystemInstruction } from './hercix-knowledge';

// Modelo por defecto. Se puede cambiar sin tocar código con GEMINI_MODEL
// (Google retira modelos: gemini-1.5-flash dejó de existir y el chat caía siempre al respaldo).
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

export const CHAT_UNAVAILABLE_MESSAGE =
  'El asistente no está disponible en este momento. Puedes revisar las secciones del menú o escribirnos desde "Soporte / Tickets".';

export interface ChatUser {
  name?: string;
  role?: string;
}

export interface ChatResult {
  response: string;
  // true solo si la respuesta la generó la IA (no el mensaje de "no disponible")
  aiAnswered: boolean;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private readonly isEnabled: boolean;
  readonly modelName: string;
  // Espera antes de reintentar un error temporal (las pruebas lo ponen en 0)
  retryDelayMs = 1500;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.modelName =
      this.config.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      this.isEnabled = true;
      this.logger.log(`Gemini AI habilitado con el modelo ${this.modelName}`);
    } else {
      this.isEnabled = false;
      this.logger.warn('Gemini AI deshabilitado: falta GEMINI_API_KEY');
    }
  }

  get enabled(): boolean {
    return this.isEnabled;
  }

  async generatePersonalizedMessage(context: {
    userName: string;
    insights: string[];
    topRecommendation?: string;
    totalReservations: number;
  }): Promise<string> {
    if (!this.isEnabled || !this.model) {
      // Fallback mensajes inteligentes sin IA
      const fallbacks = [
        `¡Hola ${context.userName}! Basándonos en tu historial hemos preparado recomendaciones personalizadas para ti. 🎯`,
        `${context.userName}, encontramos ${Math.max(1, context.totalReservations)} actividades ideales según tus preferencias. ¡Sigue así! 💪`,
        `Tu próxima gran sesión te espera, ${context.userName.split(' ')[0]}. Hemos analizado tus hábitos y encontramos las mejores opciones para ti. 🏆`,
      ];
      return fallbacks[context.totalReservations % fallbacks.length];
    }

    try {
      const prompt = `Eres el Asistente de Élite de Hercix 🏆, la plataforma SaaS deportiva líder en Latinoamérica.

Tu objetivo es motivar y guiar a "${context.userName}" para que alcance su máximo potencial.

Contexto del usuario:
- Rol: Atleta/Usuario de Hercix
- Experiencia: Ha realizado ${context.totalReservations} reservas
- Hábitos detectados: ${context.insights.join(' | ')}
- Recomendación destacada para hoy: ${context.topRecommendation || 'clases populares'}

El mensaje debe:
- Ser enérgico, profesional y motivador.
- Referenciar brevemente uno de sus hábitos (ej: "Veo que te gustan las mañanas").
- Mencionar la recomendación de hoy como algo imperdible.
- Usar un tono de "Coach Personal" de alto nivel.
- Máximo 2 oraciones. NO hables como un robot, sé humano y cercano.
- Usa máximo 2 emojis modernos (ej: ⚡, 🎯, 🔥).

Responde SOLO con el mensaje.`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      return (
        text ||
        `¡Hola ${context.userName.split(' ')[0]}! Tus recomendaciones personalizadas están listas. 💪`
      );
    } catch (error) {
      this.logger.error(`Gemini API error (${describeGeminiError(error)})`);
      return `¡Hola ${context.userName.split(' ')[0]}! Tus recomendaciones personalizadas están listas. 💪`;
    }
  }

  // Chat del asistente. Las reglas y la guía de Hercix van como instrucción de sistema y el
  // mensaje del usuario por separado, para que el usuario no pueda reescribir las reglas.
  async chatWithAssistant(
    message: string,
    user: ChatUser,
  ): Promise<ChatResult> {
    if (!this.isEnabled || !this.genAI) {
      return { response: CHAT_UNAVAILABLE_MESSAGE, aiAnswered: false };
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: buildSystemInstruction(user.role, user.name),
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      });
      const request = {
        contents: [{ role: 'user', parts: [{ text: message }] }],
      };
      // Google devuelve 503/500 en picos de demanda: se reintenta una vez antes de rendirse.
      let result: Awaited<ReturnType<typeof model.generateContent>>;
      try {
        result = await model.generateContent(request);
      } catch (error) {
        if (!isTransientGeminiError(error)) throw error;
        this.logger.warn(
          `Gemini chat: reintentando (${describeGeminiError(error)})`,
        );
        await new Promise((r) => setTimeout(r, this.retryDelayMs));
        result = await model.generateContent(request);
      }
      const text = result.response.text().trim();
      if (!text) {
        this.logger.warn('Gemini devolvió una respuesta vacía');
        return { response: CHAT_UNAVAILABLE_MESSAGE, aiAnswered: false };
      }
      return { response: text, aiAnswered: true };
    } catch (error) {
      // No se registra el mensaje del usuario, solo el tipo de error.
      this.logger.error(`Gemini chat error (${describeGeminiError(error)})`);
      return { response: CHAT_UNAVAILABLE_MESSAGE, aiAnswered: false };
    }
  }
}

// Errores temporales de Google (alta demanda o falla interna) que vale la pena reintentar.
export function isTransientGeminiError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status === 503 || status === 500;
}

// Resume el error de Gemini para el log sin volcar el objeto completo.
export function describeGeminiError(error: unknown): string {
  const status = (error as { status?: number })?.status;
  const message = error instanceof Error ? error.message : String(error);
  // El mensaje incluye la URL (".../models/x:generateContent"), así que se buscan
  // palabras completas para no confundir "generateContent" con "rate".
  if (
    status === 401 ||
    status === 403 ||
    /API_KEY_INVALID|api key not valid|\bapi key\b/i.test(message)
  )
    return 'clave de API inválida o sin permisos: revisar GEMINI_API_KEY';
  if (status === 404 || /\bnot found\b/i.test(message))
    return 'modelo no encontrado: revisar GEMINI_MODEL';
  if (
    status === 429 ||
    /RESOURCE_EXHAUSTED|\bquota\b|\brate limit/i.test(message)
  )
    return 'cuota o límite de uso excedido';
  if (isTransientGeminiError(error))
    return 'servicio de Google saturado o con falla temporal';
  if (/safety|blocked/i.test(message))
    return 'respuesta bloqueada por filtros de seguridad';
  return `error inesperado: ${message.slice(0, 200)}`;
}
