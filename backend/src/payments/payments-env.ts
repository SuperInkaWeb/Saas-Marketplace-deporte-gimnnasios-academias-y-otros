// AUD-10: chequeo de arranque de las variables de Mercado Pago.
// Devuelve la lista de problemas; main.ts los registra como error en producción.
// No detiene el arranque a propósito: con Auto-Deploy activo, una variable faltante
// tumbaría toda la API y no solo los pagos.

export function checkPaymentsEnv(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const production = env.NODE_ENV === 'production';
  const problems: string[] = [];

  const token = env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    problems.push(
      'MP_ACCESS_TOKEN no está configurada: no se pueden crear pagos',
    );
  } else if (production && token.startsWith('TEST-')) {
    problems.push(
      'MP_ACCESS_TOKEN es un token de prueba (TEST-) en producción',
    );
  }

  if (!env.FRONTEND_URL?.trim()) {
    problems.push(
      'FRONTEND_URL no está configurada: el checkout de Mercado Pago falla',
    );
  }

  if (production) {
    if (!env.MP_WEBHOOK_SECRET?.trim()) {
      problems.push(
        'MP_WEBHOOK_SECRET no está configurada: se rechazan todas las notificaciones de pago',
      );
    }
    if (!env.BACKEND_URL?.trim().startsWith('https://')) {
      problems.push(
        'BACKEND_URL falta o no es https: Mercado Pago no recibe la URL de notificación y los pagos solo se confirman si el usuario vuelve a la web',
      );
    }
  }

  return problems;
}
