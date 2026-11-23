// AUD-35: los datos inválidos se rechazan con 400 antes de llegar a la base de datos
// (antes terminaban en error 500 o se guardaban mal).
import {
  ArgumentMetadata,
  BadRequestException,
  ParseEnumPipe,
  ParseUUIDPipe,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { CreateGymDto, UpdateGymDto } from '../gyms/dto/gym.dto';
import { CreateEventDto, UpdateEventDto } from '../events/dto/event.dto';
import {
  FitbitCallbackDto,
  SyncWearableDto,
} from '../wearables/dto/wearables.dto';
import { ReviewRoleRequestDto } from '../users/dto/role-request.dto';

// Mismas opciones que el ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
const body = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({
  type: 'body',
  metatype,
  data: '',
});
const validar = (dto: ArgumentMetadata['metatype'], valor: unknown) =>
  pipe.transform(valor, body(dto)) as Promise<unknown>;

describe('AUD-35 · validación de entradas', () => {
  describe('Gimnasios', () => {
    const valido = {
      name: 'Gym Centro',
      latitude: -12.05,
      longitude: -77.04,
      phone: '+51 999 999 999',
    };

    it('acepta un gimnasio válido', async () => {
      await expect(validar(CreateGymDto, valido)).resolves.toMatchObject(
        valido,
      );
    });

    it.each([
      ['latitud fuera de rango', { latitude: 95 }],
      ['longitud fuera de rango', { longitude: -200 }],
      ['teléfono de más de 20 caracteres', { phone: '1'.repeat(21) }],
      ['ciudad de más de 100 caracteres', { city: 'x'.repeat(101) }],
      ['dirección de más de 300 caracteres', { address: 'x'.repeat(301) }],
    ])('rechaza %s', async (_caso, cambio) => {
      await expect(
        validar(CreateGymDto, { ...valido, ...cambio }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(validar(UpdateGymDto, cambio)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('no limita el logo (llega en base64)', async () => {
      const logoUrl = 'data:image/png;base64,' + 'A'.repeat(50_000);
      await expect(validar(UpdateGymDto, { logoUrl })).resolves.toMatchObject({
        logoUrl,
      });
    });
  });

  describe('Tickets', () => {
    // Mismo pipe que usa PATCH /tickets/:id/status sobre el cuerpo
    const estado: PipeTransform<unknown, Promise<unknown>> = new ParseEnumPipe(
      TicketStatus,
    );
    const meta: ArgumentMetadata = { type: 'body', data: 'status' };

    it('acepta un estado válido', async () => {
      await expect(estado.transform('RESOLVED', meta)).resolves.toBe(
        'RESOLVED',
      );
    });

    it('rechaza un estado que no existe', async () => {
      await expect(estado.transform('hola', meta)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza un id que no es UUID', async () => {
      await expect(
        new ParseUUIDPipe().transform('123', { type: 'param', data: 'id' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('Wearables', () => {
    it('acepta una sincronización válida', async () => {
      const datos = {
        steps: 8000,
        heartRateAvg: 72,
        calories: 2100,
        deviceType: 'FITBIT',
      };
      await expect(validar(SyncWearableDto, datos)).resolves.toMatchObject(
        datos,
      );
    });

    it.each([
      ['pasos negativos', { steps: -5 }],
      ['pasos que desbordan la columna Int', { steps: 3_000_000_000 }],
      ['pasos con decimales', { steps: 10.5 }],
      ['campos desconocidos', { foo: 'bar' }],
    ])('rechaza %s', async (_caso, datos) => {
      await expect(validar(SyncWearableDto, datos)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('exige el código de autorización y la redirect_uri de Google Health', async () => {
      await expect(validar(FitbitCallbackDto, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(
        validar(FitbitCallbackDto, { code: 'abc' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      const ok = {
        code: 'abc',
        redirect_uri: 'https://hercix.com/dashboard/wearables/fitbit-callback',
      };
      await expect(validar(FitbitCallbackDto, ok)).resolves.toMatchObject(ok);
    });
  });

  describe('Solicitudes de rol', () => {
    it('acepta aprobar sin nota (como hace el frontend)', async () => {
      await expect(validar(ReviewRoleRequestDto, {})).resolves.toEqual({});
    });

    it('rechaza una nota que no es texto o es demasiado larga', async () => {
      await expect(
        validar(ReviewRoleRequestDto, { adminNote: 123 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validar(ReviewRoleRequestDto, { adminNote: 'x'.repeat(1001) }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('Eventos', () => {
    it('permite editar enviando solo un campo (H-22)', async () => {
      await expect(
        validar(UpdateEventDto, { title: 'Nuevo título' }),
      ).resolves.toMatchObject({ title: 'Nuevo título' });
    });

    it('al crear sigue exigiendo los campos obligatorios', async () => {
      await expect(
        validar(CreateEventDto, { title: 'Solo título' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un título de más de 200 caracteres o un precio negativo', async () => {
      await expect(
        validar(UpdateEventDto, { title: 'x'.repeat(201) }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validar(UpdateEventDto, { price: -10 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
