import { buildError } from 'mercadopago';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

// Webhook de Mercado Pago: un pago inexistente responde 200 (sin reintentos);
// cualquier otro error se propaga (500) para que Mercado Pago reintente.
describe('PaymentsController.webhook', () => {
  const process = jest.fn();
  const controller = new PaymentsController({
    processMercadoPagoPayment: process,
  } as unknown as PaymentsService);
  const body = (id: string, type = 'payment') => ({ type, data: { id } });

  beforeEach(() => process.mockReset());

  it('procesa un pago existente y responde ok', async () => {
    process.mockResolvedValue({ status: 'COMPLETED' });
    await expect(controller.webhook(body('123'), {})).resolves.toEqual({
      ok: true,
    });
    expect(process).toHaveBeenCalledWith('123');
  });

  it('ignora un pago que no existe en Mercado Pago (404) y responde 200', async () => {
    process.mockRejectedValue(
      buildError(404, { message: 'Payment not found', status: 404 }),
    );
    await expect(controller.webhook(body('123456'), {})).resolves.toEqual({
      ok: true,
      ignored: true,
    });
  });

  it('propaga los demás errores de Mercado Pago para que reintente', async () => {
    const err = buildError(500, { message: 'Internal error', status: 500 });
    process.mockRejectedValue(err);
    await expect(controller.webhook(body('123'), {})).rejects.toBe(err);
  });

  it('propaga los errores propios (por ejemplo, de la base de datos)', async () => {
    const err = new Error('db caída');
    process.mockRejectedValue(err);
    await expect(controller.webhook(body('123'), {})).rejects.toBe(err);
  });

  it('no procesa notificaciones que no son de pagos', async () => {
    await expect(
      controller.webhook(body('123', 'merchant_order'), {}),
    ).resolves.toEqual({ ok: true });
    expect(process).not.toHaveBeenCalled();
  });
});
