import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/** Escapa texto para interpolarlo en HTML de correos. */
export const escapeHtml = (value: string): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly fromName: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    const email = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const name = process.env.RESEND_FROM_NAME || 'Hercix Health';
    this.from = `${name} <${email}>`;
    this.fromName = name;
  }

  // ─── Base template ─────────────────────────────────────────────────────────
  private baseTemplate(content: string, previewText = ''): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6d28d9,#a855f7);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
              ⚡ Hercix<span style="color:#e9d5ff;"> Health</span>
            </h1>
            <p style="margin:6px 0 0;color:#e9d5ff;font-size:13px;">Tu plataforma deportiva todo en uno</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#1a1a2e;padding:40px;border-left:1px solid #2d2d4e;border-right:1px solid #2d2d4e;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#12122a;border-radius:0 0 16px 16px;border:1px solid #2d2d4e;border-top:none;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:12px;">
              © 2026 QORIBEX · Todos los derechos reservados<br/>
              <a href="#" style="color:#a855f7;text-decoration:none;">Darse de baja</a> · 
              <a href="#" style="color:#a855f7;text-decoration:none;">Política de privacidad</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ─── 1. Email de Bienvenida ─────────────────────────────────────────────────
  async sendWelcome(to: string, name: string): Promise<void> {
    const content = `
      <h2 style="margin:0 0 8px;color:#fff;font-size:24px;">¡Bienvenido, ${name}! 🎉</h2>
      <p style="margin:0 0 24px;color:#a0aec0;font-size:15px;line-height:1.6;">
        Tu cuenta en Hercix Health está lista. Ahora tienes acceso a:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['🏋️', 'Reserva clases', 'Yoga, CrossFit, fútbol y más en tu zona'],
          ['🛒', 'Marketplace', 'Equipo deportivo y entrenadores freelance'],
          ['🤖', 'IA personalizada', 'Recomendaciones según tu nivel y ubicación'],
          ['📊', 'Tu progreso', 'Conecta tu Fitbit o Apple Watch'],
        ]
          .map(
            ([icon, title, desc]) => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #2d2d4e;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:28px;padding-right:16px;">${icon}</td>
                <td>
                  <p style="margin:0;color:#fff;font-size:14px;font-weight:600;">${title}</p>
                  <p style="margin:2px 0 0;color:#9ca3af;font-size:13px;">${desc}</p>
                </td>
              </tr></table>
            </td>
          </tr>`,
          )
          .join('')}
      </table>
      <div style="margin-top:32px;text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'https://hercix.com'}" style="background:linear-gradient(135deg,#6d28d9,#a855f7);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
          Explorar Hercix Health →
        </a>
      </div>
    `;
    await this.send(to, '¡Bienvenido a Hercix Health! 🚀', content, '¡Tu cuenta está lista!');
  }

  // ─── Invitation Email ──────────────────────────────────────────────────────
  async sendInvitation(to: string, role: string, invitationLink: string): Promise<void> {
    const content = `
      <h2 style="margin:0 0 8px;color:#fff;font-size:24px;">¡Has sido invitado a Hercix Health! ⚡</h2>
      <p style="margin:0 0 24px;color:#a0aec0;font-size:15px;line-height:1.6;">
        Un administrador o dueño de negocio te ha invitado a unirte a la plataforma con el rol de <strong>${role}</strong>.
      </p>
      <div style="margin-top:32px;text-align:center;">
        <a href="${invitationLink}" style="background:linear-gradient(135deg,#e11d48,#f43f5e);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
          Aceptar Invitación y Registrarse →
        </a>
      </div>
      <p style="margin:24px 0 0;color:#6b7280;font-size:12px;text-align:center;">
        Este enlace es de un solo uso y vencerá automáticamente en un periodo de 7 días.
      </p>
    `;
    await this.send(to, 'Invitación especial a Hercix Health ⚡', content, 'Has sido invitado a Hercix Health');
  }

  // ─── 2. Confirmación de Reserva ─────────────────────────────────────────────
  async sendBookingConfirmation(
    to: string,
    data: { userName: string; className: string; gymName: string; date: Date; price: number },
  ): Promise<void> {
    const dateStr = data.date.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeStr = data.date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const content = `
      <h2 style="margin:0 0 4px;color:#fff;font-size:22px;">¡Reserva confirmada! ✅</h2>
      <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;">Hola ${data.userName}, tu clase está lista.</p>
      <div style="background:#12122a;border:1px solid #6d28d9;border-radius:12px;padding:24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['📚 Clase', data.className],
            ['🏢 Gimnasio', data.gymName],
            ['📅 Fecha', dateStr],
            ['⏰ Hora', timeStr],
            ['💰 Precio', `$${data.price.toLocaleString('es-CO')} COP`],
          ]
            .map(
              ([label, value]) => `
            <tr>
              <td style="padding:8px 0;color:#9ca3af;font-size:13px;width:40%;">${label}</td>
              <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${value}</td>
            </tr>`,
            )
            .join('')}
        </table>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
        💡 <strong style="color:#a855f7;">Tip:</strong> Llega 10 minutos antes para tener tu lugar asegurado.
      </p>
    `;
    await this.send(to, `Reserva confirmada: ${data.className} 🏋️`, content, 'Tu clase está reservada');
  }

  // ─── 3. Confirmación de Pago ────────────────────────────────────────────────
  async sendPaymentConfirmation(
    to: string,
    data: { userName: string; amount: number; description: string; invoiceId?: string },
  ): Promise<void> {
    const content = `
      <h2 style="margin:0 0 4px;color:#fff;font-size:22px;">Pago recibido 💳</h2>
      <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;">Hola ${data.userName}, tu pago fue procesado exitosamente.</p>
      <div style="background:#052e16;border:1px solid #16a34a;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;color:#86efac;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Total pagado</p>
        <p style="margin:8px 0 0;color:#fff;font-size:40px;font-weight:800;">$${data.amount.toLocaleString('es-CO')}</p>
        <p style="margin:4px 0 0;color:#86efac;font-size:13px;">COP</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2d2d4e;padding-top:16px;margin-top:16px;">
        <tr>
          <td style="color:#9ca3af;font-size:13px;">Descripción</td>
          <td style="color:#fff;font-size:13px;text-align:right;">${data.description}</td>
        </tr>
        ${data.invoiceId ? `<tr><td style="color:#9ca3af;font-size:13px;padding-top:8px;">ID Factura</td><td style="color:#a855f7;font-size:13px;text-align:right;padding-top:8px;">#${data.invoiceId}</td></tr>` : ''}
        <tr>
          <td style="color:#9ca3af;font-size:13px;padding-top:8px;">Fecha</td>
          <td style="color:#fff;font-size:13px;text-align:right;padding-top:8px;">${new Date().toLocaleDateString('es-CO')}</td>
        </tr>
      </table>
    `;
    await this.send(to, 'Confirmación de pago Hercix 💳', content, 'Tu pago fue exitoso');
  }

  // ─── 4. Membresía Activada ──────────────────────────────────────────────────
  async sendMembershipActivated(
    to: string,
    data: { userName: string; planName: string; gymName: string; expiresAt: Date },
  ): Promise<void> {
    const expiryStr = data.expiresAt.toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const content = `
      <h2 style="margin:0 0 4px;color:#fff;font-size:22px;">¡Membresía activada! 🏆</h2>
      <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;">Hola ${data.userName}, ya tienes acceso completo.</p>
      <div style="background:linear-gradient(135deg,#4c1d95,#6d28d9);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;color:#e9d5ff;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Plan activo</p>
        <p style="margin:8px 0 4px;color:#fff;font-size:28px;font-weight:800;">${data.planName}</p>
        <p style="margin:0;color:#c4b5fd;font-size:14px;">📍 ${data.gymName}</p>
        <div style="margin-top:16px;background:rgba(255,255,255,0.1);border-radius:8px;padding:10px;">
          <p style="margin:0;color:#e9d5ff;font-size:12px;">Válida hasta</p>
          <p style="margin:4px 0 0;color:#fff;font-size:15px;font-weight:600;">${expiryStr}</p>
        </div>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;text-align:center;">
        ¡A entrenar! Reserva tus clases directamente desde la plataforma. 💪
      </p>
    `;
    await this.send(to, `¡Membresía ${data.planName} activada! 🏆`, content, 'Tu membresía está activa');
  }

  // ─── 5. Campaña de Marketing ────────────────────────────────────────────────
  async sendMarketingCampaign(
    to: string,
    data: { name: string; subject: string; headline: string; body: string; ctaText: string; ctaUrl: string },
  ): Promise<void> {
    // AUD-22: el dueño escribe texto plano; se escapa para que no pueda inyectar HTML (enlaces, formularios).
    const headline = escapeHtml(data.headline);
    const body = escapeHtml(data.body ?? '').replace(/\r?\n/g, '<br>');
    const content = `
      <h2 style="margin:0 0 16px;color:#fff;font-size:24px;">${headline}</h2>
      <div style="color:#a0aec0;font-size:15px;line-height:1.7;margin-bottom:32px;">${body}</div>
      <div style="text-align:center;">
        <a href="${data.ctaUrl}" style="background:linear-gradient(135deg,#6d28d9,#a855f7);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
          ${data.ctaText} →
        </a>
      </div>
    `;
    await this.send(to, data.subject, content, headline);
  }

  // ─── Internal send ──────────────────────────────────────────────────────────
  private async send(to: string, subject: string, content: string, previewText: string): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(`[Email simulado] Para: ${to} | Asunto: ${subject}`);
      return;
    }
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html: this.baseTemplate(content, previewText),
      });
      if (error) {
        this.logger.error(`Error enviando email a ${to}: ${JSON.stringify(error)}`);
      } else {
        this.logger.log(`✅ Email enviado a ${to} | ID: ${data?.id}`);
      }
    } catch (err) {
      this.logger.error(`Excepción al enviar email: ${err.message}`);
    }
  }
}
