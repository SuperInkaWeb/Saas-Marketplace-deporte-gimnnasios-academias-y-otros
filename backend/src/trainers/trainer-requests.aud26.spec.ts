/* eslint-disable @typescript-eslint/require-await --
   El Prisma falso en memoria trabaja con objetos sin tipar a propósito: sirve tanto para el código anterior
   (archivo JSON) como para el corregido (tabla gym_trainer_requests). */
import 'reflect-metadata';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AUD-26: las postulaciones entrenador → gimnasio vivían en pending-requests.json, en el
 * disco del servidor. En Render ese disco se recrea en cada deploy/reinicio, así que las
 * postulaciones pendientes se perdían. Se simula un "redeploy" con una instancia nueva del
 * servicio y un directorio de trabajo vacío; la base de datos (fake en memoria) se conserva.
 */

const OWNER = { id: 'owner-1', role: 'GYM_OWNER' };
const OTHER_OWNER = { id: 'owner-2', role: 'GYM_OWNER' };
const ADMIN = { id: 'admin-1', role: 'ADMIN' };
const TRAINER_USER = 'coach-user-1';

function fakeDb() {
  const users: Record<string, any> = {
    [TRAINER_USER]: {
      id: TRAINER_USER,
      name: 'Coach Uno',
      email: 'coach1@local.test',
    },
  };
  const gyms: any[] = [
    { id: 'gym-1', name: 'Gym Uno', ownerId: OWNER.id, status: 'ACTIVE' },
    { id: 'gym-2', name: 'Gym Cerrado', ownerId: OWNER.id, status: 'INACTIVE' },
  ];
  const profiles: any[] = [{ id: 'tp-1', userId: TRAINER_USER }];
  const links: any[] = [];
  const requests: any[] = [];
  let seq = 0;

  const withInclude = (r: any, include?: any) => {
    if (!r) return r;
    const out = { ...r };
    if (include?.gym) out.gym = { ...gyms.find((g) => g.id === r.gymId) };
    if (include?.trainer) {
      const tp = profiles.find((p) => p.id === r.trainerId);
      out.trainer = { ...tp, user: users[tp.userId] };
    }
    return out;
  };
  const matchReq = (r: any, where: any = {}) =>
    (where.id === undefined || r.id === where.id) &&
    (where.status === undefined || r.status === where.status) &&
    (where.gym?.ownerId === undefined ||
      gyms.find((g) => g.id === r.gymId)?.ownerId === where.gym.ownerId) &&
    (where.trainer?.userId === undefined ||
      profiles.find((p) => p.id === r.trainerId)?.userId ===
        where.trainer.userId);

  const db: any = {
    _links: links,
    _requests: requests,
    trainerProfile: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const tp = profiles.find(
          (p) => p.userId === where.userId || p.id === where.id,
        );
        if (!tp) return null;
        return include?.user ? { ...tp, user: users[tp.userId] } : { ...tp };
      }),
    },
    gym: {
      findUnique: jest.fn(
        async ({ where }: any) => gyms.find((g) => g.id === where.id) ?? null,
      ),
      findMany: jest.fn(async ({ where }: any) =>
        gyms.filter((g) => g.ownerId === where.ownerId),
      ),
    },
    gymTrainer: {
      findUnique: jest.fn(async ({ where }: any) => {
        const k = where.gymId_trainerId;
        return (
          links.find(
            (l) => l.gymId === k.gymId && l.trainerId === k.trainerId,
          ) ?? null
        );
      }),
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const k = where.gymId_trainerId;
        const found = links.find(
          (l) => l.gymId === k.gymId && l.trainerId === k.trainerId,
        );
        if (found) return Object.assign(found, update);
        const row = { id: `gt-${++seq}`, ...create };
        links.push(row);
        return row;
      }),
    },
    gymTrainerRequest: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const k = where.gymId_trainerId;
        const r = k
          ? requests.find(
              (x) => x.gymId === k.gymId && x.trainerId === k.trainerId,
            )
          : requests.find((x) => x.id === where.id);
        return withInclude(r ?? null, include);
      }),
      findMany: jest.fn(async ({ where, include }: any) =>
        requests
          .filter((r) => matchReq(r, where))
          .map((r) => withInclude(r, include)),
      ),
      create: jest.fn(async ({ data, include }: any) => {
        if (
          requests.some(
            (x) => x.gymId === data.gymId && x.trainerId === data.trainerId,
          )
        ) {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        const row = {
          id: `req-${++seq}`,
          status: 'PENDING',
          respondedById: null,
          respondedAt: null,
          createdAt: new Date(),
          ...data,
        };
        requests.push(row);
        return withInclude(row, include);
      }),
      update: jest.fn(async ({ where, data, include }: any) => {
        const r = requests.find((x) => x.id === where.id);
        Object.assign(r, data);
        return withInclude(r, include);
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const rows = requests.filter((r) => matchReq(r, where));
        rows.forEach((r) => Object.assign(r, data));
        return { count: rows.length };
      }),
    },
  };
  db.$transaction = jest.fn(async (fn: any) => fn(db));
  return db;
}

describe('Postulaciones de entrenadores a gimnasios (AUD-26)', () => {
  const cwdOriginal = process.cwd();
  const tmpDirs: string[] = [];
  let db: any;

  /** Simula un deploy nuevo: disco vacío (cwd nuevo) e instancia nueva del servicio. */
  const deploy = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aud26-'));
    tmpDirs.push(dir);
    process.chdir(dir);
    return new TrainersService(db as PrismaService);
  };
  /** El código anterior recibía el id del dueño; el corregido recibe el usuario (para permitir ADMIN). */
  const respond = (
    svc: any,
    id: string,
    user: { id: string; role: string },
    approve: boolean,
  ) =>
    svc.respondToRequest(
      id,
      typeof svc.readPendingRequests === 'function' ? user.id : user,
      approve,
    );

  beforeEach(() => {
    db = fakeDb();
  });
  afterEach(() => process.chdir(cwdOriginal));
  afterAll(() =>
    tmpDirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true })),
  );

  describe('persistencia', () => {
    it('la postulación sigue visible para el dueño después de un redeploy', async () => {
      const antes = deploy();
      await antes.requestLinkToGym('gym-1', TRAINER_USER);
      const despues = deploy();
      const lista = await despues.getPendingRequestsForOwner(OWNER.id);
      expect(lista).toHaveLength(1);
      expect(lista[0]).toMatchObject({
        gymId: 'gym-1',
        gymName: 'Gym Uno',
        trainerName: 'Coach Uno',
        trainerEmail: 'coach1@local.test',
      });
    });

    it('el entrenador sigue viendo su postulación pendiente después de un redeploy', async () => {
      await deploy().requestLinkToGym('gym-1', TRAINER_USER);
      const lista = await deploy().getPendingRequestsForTrainer(TRAINER_USER);
      expect(lista.map((r: any) => r.gymId)).toEqual(['gym-1']);
    });

    it('el dueño puede aprobar después de un redeploy y el entrenador queda vinculado', async () => {
      const creada: any = await deploy().requestLinkToGym(
        'gym-1',
        TRAINER_USER,
      );
      await respond(deploy(), creada.id, OWNER, true);
      expect(db._links).toEqual([
        expect.objectContaining({
          gymId: 'gym-1',
          trainerId: 'tp-1',
          canCreateClasses: true,
        }),
      ]);
    });

    it('no escribe pending-requests.json en el disco del servidor', async () => {
      const svc = deploy();
      await svc.requestLinkToGym('gym-1', TRAINER_USER);
      expect(
        fs.existsSync(path.join(process.cwd(), 'pending-requests.json')),
      ).toBe(false);
    });
  });

  describe('reglas', () => {
    it('no permite postular a un gimnasio inactivo (409)', async () => {
      await expect(
        deploy().requestLinkToGym('gym-2', TRAINER_USER),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('el ADMIN puede responder una postulación', async () => {
      const svc = deploy();
      const creada: any = await svc.requestLinkToGym('gym-1', TRAINER_USER);
      await expect(
        respond(svc, creada.id, ADMIN, false),
      ).resolves.toMatchObject({ success: true });
    });

    it('"approve" debe ser booleano: el texto "false" no aprueba', async () => {
      // require: con el código anterior el DTO no existe y la prueba debe fallar, no dejar de compilar
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RespondLinkRequestDto } = require('./dto/trainer.dto');
      expect(RespondLinkRequestDto).toBeDefined();
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      await expect(
        pipe.transform(
          { approve: 'false' },
          { type: 'body', metatype: RespondLinkRequestDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        pipe.transform(
          { approve: false },
          { type: 'body', metatype: RespondLinkRequestDto },
        ),
      ).resolves.toMatchObject({ approve: false });
    });
  });

  describe('regresión (igual antes y después)', () => {
    it('crea la postulación con los campos que usa el frontend', async () => {
      const creada = await deploy().requestLinkToGym('gym-1', TRAINER_USER);
      expect(creada).toMatchObject({
        id: expect.any(String),
        gymId: 'gym-1',
        gymName: 'Gym Uno',
        trainerName: 'Coach Uno',
        trainerEmail: 'coach1@local.test',
      });
    });

    it('no permite una segunda postulación pendiente a la misma sede (400)', async () => {
      const svc = deploy();
      await svc.requestLinkToGym('gym-1', TRAINER_USER);
      await expect(
        svc.requestLinkToGym('gym-1', TRAINER_USER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('si ya está vinculado no puede postular (400)', async () => {
      db._links.push({
        id: 'gt-x',
        gymId: 'gym-1',
        trainerId: 'tp-1',
        canCreateClasses: false,
      });
      await expect(
        deploy().requestLinkToGym('gym-1', TRAINER_USER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('otro dueño no puede responder (403)', async () => {
      const svc = deploy();
      const creada: any = await svc.requestLinkToGym('gym-1', TRAINER_USER);
      await expect(
        respond(svc, creada.id, OTHER_OWNER, true),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(db._links).toHaveLength(0);
    });

    it('tras un rechazo sale de la lista y puede volver a postular', async () => {
      const svc = deploy();
      const creada: any = await svc.requestLinkToGym('gym-1', TRAINER_USER);
      await respond(svc, creada.id, OWNER, false);
      expect(await svc.getPendingRequestsForOwner(OWNER.id)).toHaveLength(0);
      expect(db._links).toHaveLength(0);
      await expect(
        svc.requestLinkToGym('gym-1', TRAINER_USER),
      ).resolves.toMatchObject({ gymId: 'gym-1' });
      expect(await svc.getPendingRequestsForOwner(OWNER.id)).toHaveLength(1);
    });
  });
});
