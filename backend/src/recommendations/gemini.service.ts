import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private readonly isEnabled: boolean;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isEnabled = true;
      this.logger.log('✅ Gemini AI enabled with gemini-1.5-flash');
    } else {
      this.isEnabled = false;
      this.logger.warn('⚠️  Gemini AI disabled — set GEMINI_API_KEY in .env to enable');
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
      const prompt = `Eres el Asistente de Élite de SportNexus 🏆, la plataforma SaaS deportiva líder en Latinoamérica.
      
Tu objetivo es motivar y guiar a "${context.userName}" para que alcance su máximo potencial.

Contexto del usuario:
- Rol: Atleta/Usuario de SportNexus
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
      return text || `¡Hola ${context.userName.split(' ')[0]}! Tus recomendaciones personalizadas están listas. 💪`;
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      return `¡Hola ${context.userName.split(' ')[0]}! Tus recomendaciones personalizadas están listas. 💪`;
    }
  }

  async chatWithAssistant(message: string, userContext: string): Promise<string> {
    if (!this.isEnabled || !this.model) {
      return this.getFallbackChatResponse(message);
    }

    try {
      const prompt = `
        Eres el Asistente de Élite de SportNexus 🏆. Tu tono debe ser el de un Consultor Senior de Negocios Deportivos y un Coach de Alto Rendimiento combined.
        
        REGLAS DE ORO:
        1. Si el usuario es un DUEÑO, háblale de ROI, retención de clientes y optimización financiera.
        2. Si el usuario es un COACH, háblale de programación de atletas, biomecánica y motivación de equipo.
        3. Si el usuario es un ATLETA, háblale de disciplina, superación personal y salud basada en métricas.
        4. TIENES ACCESO A DATOS DE WEARABLES: Si el usuario menciona fatiga o rendimiento, recuérdale que SportNexus monitoriza sus pasos, ritmo cardíaco y calorías para darle el plan perfecto. Mantente siempre motivador pero con autoridad científica.
        5. Branding: Usa "SportNexus" como la plataforma definitiva que une SaaS y Marketplace.
        6. Personalidad: Eres audaz, directo y buscas la excelencia del usuario.
      
Contexto del usuario actual:
${userContext}

Mensaje del usuario: "${message}"`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      this.logger.error('Gemini chat error:', error);
      return this.getFallbackChatResponse(message);
    }
  }

  private getFallbackChatResponse(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('clase') || lower.includes('reserva'))
      return 'Puedes reservar clases desde la sección "Clases" del menú. Tenemos yoga, CrossFit, fútbol y más. ¡Elige la que más te guste!';
    if (lower.includes('membresía') || lower.includes('plan') || lower.includes('precio'))
      return 'Tenemos planes de membresía flexibles. Ve a la sección "Membresías" para ver todos los precios y beneficios disponibles.';
    if (lower.includes('gimnasio') || lower.includes('gym'))
      return 'Puedes explorar todos los gimnasios disponibles en la sección "Gimnasios" o usar el mapa en "Descubrir" para encontrar el más cercano.';
    if (lower.includes('evento') || lower.includes('torneo'))
      return 'Revisa la sección "Eventos" para ver torneos, masterclasses y workshops próximos en tu ciudad.';
    if (lower.includes('tienda') || lower.includes('producto') || lower.includes('equipo'))
      return 'En nuestra "Tienda" encuentras equipamiento deportivo de los mejores proveedores. ¡Agrega lo que necesites al carrito!';
    return 'Estoy aquí para ayudarte con SportNexus. Puedes preguntar sobre clases, membresías, gimnasios, eventos o la tienda deportiva. ¿En qué te puedo asistir?';
  }
}
