import 'reflect-metadata';
import {
  BadRequestException,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { EmailService } from '../notifications/email.service';
import { computeEligibleRoles } from '../common/roles/role-eligibility';

/**
 * AUD-18: modelo de roles.
 *  1) Un rol revocado por un admin no se recupera con /auth/switch-role.
 *  2) El registro público siempre crea USER.
 *  3) Un admin no modifica a otro admin ni cambia su propio rol.
 */

type Row = Record<string, any>;

/** BD en memoria con lo justo que usan UsersService/AuthService para roles. */
function fakeDb() {
  let clock = 1;
  const tick = () => new Date(2026, 10, 18, 0, 0, clock++);
  const users = new Map<string, Row>();
  const gyms: Row[] = [];
  const trainerProfiles = new Map<string, Row>();
  const roleRequests: Row[] = [];
  const pick = (row: Row, select?: Row) =>
    select
      ? Object.fromEntries(Object.keys(select).map((k) => [k, row[k]]))
      : { ...row };
  const matches = (r: Row, where: Row) =>
    Object.entries(where).every(([k, v]) =>
      v && typeof v === 'object' && 'in' in v
        ? v.in.includes(r[k])
        : r[k] === v,
    );

  const db: any = {
    users,
    roleRequests,
    user: {
      findUnique: jest.fn(async ({ where, select }: any) => {
        const u = users.get(where.id);
        return u ? pick(u, select) : null;
      }),
      findFirst: jest.fn(async () => null),
      count: jest.fn(
        async ({ where }: any) =>
          [...users.values()].filter((u) => matches(u, where)).length,
      ),
      update: jest.fn(async ({ where, data, select }: any) => {
        const u = { ...users.get(where.id), ...data };
        users.set(where.id, u);
        return pick(u, select);
      }),
      create: jest.fn(async ({ data, select }: any) => {
        const u = { id: `u-${users.size + 1}`, ...data };
        users.set(u.id, u);
        return pick(u, select);
      }),
    },
    gym: {
      count: jest.fn(
        async ({ where }: any) =>
          gyms.filter((g) => g.ownerId === where.ownerId).length,
      ),
    },
    trainerProfile: {
      findUnique: jest.fn(
        async ({ where }: any) => trainerProfiles.get(where.userId) ?? null,
      ),
      create: jest.fn(async ({ data }: any) => {
        trainerProfiles.set(data.userId, { id: `tp-${data.userId}`, ...data });
        return trainerProfiles.get(data.userId);
      }),
    },
    roleRequest: {
      findMany: jest.fn(async ({ where, orderBy }: any) => {
        const rows = roleRequests.filter((r) => matches(r, where));
        if (orderBy?.updatedAt === 'desc')
          rows.sort((a, b) => b.updatedAt - a.updatedAt);
        return rows.map((r) => ({ ...r }));
      }),
      findFirst: jest.fn(
        async ({ where }: any) =>
          roleRequests.find((r) => matches(r, where)) ?? null,
      ),
      findUnique: jest.fn(async ({ where }: any) => {
        const r = roleRequests.find((x) => x.id === where.id);
        return r ? { ...r, user: users.get(r.userId) } : null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const now = tick();
        const r = {
          id: `rr-${roleRequests.length + 1}`,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        roleRequests.push(r);
        return { ...r };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const r = roleRequests.find((x) => x.id === where.id)!;
        Object.assign(r, data, { updatedAt: tick() });
        return { ...r };
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const rows = roleRequests.filter((r) => matches(r, where));
        rows.forEach((r) => Object.assign(r, data, { updatedAt: tick() }));
        return { count: rows.length };
      }),
    },
    $transaction: jest.fn(async (cb: any) => cb(db)),
    addUser(u: Row) {
      users.set(u.id, {
        isActive: true,
        email: `${u.id}@example.com`,
        name: u.id,
        ...u,
      });
    },
    addGym(ownerId: string) {
      gyms.push({ id: `gym-${gyms.length + 1}`, ownerId });
    },
    addTrainerProfile(userId: string) {
      trainerProfiles.set(userId, { id: `tp-${userId}`, userId });
    },
  };
  return db;
}

const ADMIN = { id: 'admin-1', role: UserRole.ADMIN };
const editBody = (u: Row, over: Row = {}) => ({
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.isActive !== false,
  ...over,
});

describe('AUD-18: modelo de roles', () => {
  let db: ReturnType<typeof fakeDb>;
  let users: UsersService;
  let auth: AuthService;

  beforeEach(() => {
    db = fakeDb();
    users = new UsersService(db);
    auth = new AuthService(
      db,
      {} as JwtService,
      {} as ConfigService,
      {
        sendWelcome: jest.fn().mockResolvedValue(undefined),
      } as unknown as EmailService,
    );
    db.addUser(ADMIN);
  });

  describe('1) revocación efectiva', () => {
    it('ANTES/H-34: dueño aprobado, el admin lo baja a USER y ya no puede volver a GYM_OWNER', async () => {
      db.addUser({ id: 'u1', role: UserRole.USER });
      const req = await users.createRoleRequest('u1', UserRole.GYM_OWNER);
      await users.approveRoleRequest(req.id);
      db.addGym('u1'); // ya creó su gimnasio
      expect(await computeEligibleRoles(db, db.users.get('u1'))).toContain(
        UserRole.GYM_OWNER,
      );

      await users.update(
        'u1',
        editBody(db.users.get('u1'), { role: UserRole.USER }),
        ADMIN.id,
      );

      expect(db.users.get('u1').role).toBe(UserRole.USER);
      expect(await computeEligibleRoles(db, db.users.get('u1'))).toEqual([
        UserRole.USER,
      ]);
      await expect(
        auth.switchRole('u1', UserRole.GYM_OWNER),
      ).rejects.toBeInstanceOf(BadRequestException);
      // La solicitud aprobada queda marcada como revocada (lo ve el usuario y el admin).
      expect(db.roleRequests.find((r) => r.id === req.id)?.status).toBe(
        'REVOKED',
      );
    });

    it('revoca también un rol que venía solo de tener perfil de entrenador (sin solicitud)', async () => {
      db.addUser({ id: 'coach', role: UserRole.TRAINER });
      db.addTrainerProfile('coach');

      await users.update(
        'coach',
        editBody(db.users.get('coach'), { role: UserRole.USER }),
        ADMIN.id,
      );

      expect(db.roleRequests).toEqual([
        expect.objectContaining({
          userId: 'coach',
          requestedRole: UserRole.TRAINER,
          status: 'REVOKED',
        }),
      ]);
      await expect(
        auth.switchRole('coach', UserRole.TRAINER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('al bajarlo a USER se revocan todos sus roles (dueño y entrenador a la vez)', async () => {
      db.addUser({ id: 'u2', role: UserRole.GYM_OWNER });
      db.addGym('u2');
      db.addTrainerProfile('u2');

      await users.update(
        'u2',
        editBody(db.users.get('u2'), { role: UserRole.USER }),
        ADMIN.id,
      );

      expect(await computeEligibleRoles(db, db.users.get('u2'))).toEqual([
        UserRole.USER,
      ]);
    });

    it('si el admin lo cambia de dueño a entrenador, conserva entrenador y pierde dueño', async () => {
      db.addUser({ id: 'u3', role: UserRole.GYM_OWNER });
      db.addGym('u3');

      await users.update(
        'u3',
        editBody(db.users.get('u3'), { role: UserRole.TRAINER }),
        ADMIN.id,
      );

      const roles = await computeEligibleRoles(db, db.users.get('u3'));
      expect(roles).toContain(UserRole.TRAINER);
      expect(roles).not.toContain(UserRole.GYM_OWNER);
    });

    it('volver a otorgar: el admin le asigna de nuevo GYM_OWNER y puede cambiar de vista', async () => {
      db.addUser({ id: 'u4', role: UserRole.GYM_OWNER });
      db.addGym('u4');
      await users.update(
        'u4',
        editBody(db.users.get('u4'), { role: UserRole.USER }),
        ADMIN.id,
      );

      await users.update(
        'u4',
        editBody(db.users.get('u4'), { role: UserRole.GYM_OWNER }),
        ADMIN.id,
      );
      // pasa a vista atleta y vuelve a dueño
      await auth.switchRole('u4', UserRole.USER);
      await expect(
        auth.switchRole('u4', UserRole.GYM_OWNER),
      ).resolves.toMatchObject({ role: UserRole.GYM_OWNER });
    });

    it('volver a otorgar: una solicitud nueva aprobada devuelve el rol', async () => {
      db.addUser({ id: 'u5', role: UserRole.GYM_OWNER });
      db.addGym('u5');
      await users.update(
        'u5',
        editBody(db.users.get('u5'), { role: UserRole.USER }),
        ADMIN.id,
      );

      const again = await users.createRoleRequest('u5', UserRole.GYM_OWNER);
      await users.approveRoleRequest(again.id);
      await auth.switchRole('u5', UserRole.USER);
      await expect(
        auth.switchRole('u5', UserRole.GYM_OWNER),
      ).resolves.toMatchObject({ role: UserRole.GYM_OWNER });
    });

    it('regresión: editar datos sin cambiar el rol no revoca nada', async () => {
      db.addUser({ id: 'u6', role: UserRole.USER });
      db.addGym('u6'); // dueño en vista atleta

      await users.update(
        'u6',
        editBody(db.users.get('u6'), { name: 'Nuevo nombre' }),
        ADMIN.id,
      );

      expect(db.roleRequests).toHaveLength(0);
      expect(await computeEligibleRoles(db, db.users.get('u6'))).toContain(
        UserRole.GYM_OWNER,
      );
    });

    it('regresión: un dueño con gimnasio (sin solicitud) puede ir a vista atleta y volver', async () => {
      db.addUser({ id: 'u7', role: UserRole.GYM_OWNER });
      db.addGym('u7');
      await auth.switchRole('u7', UserRole.USER);
      await expect(
        auth.switchRole('u7', UserRole.GYM_OWNER),
      ).resolves.toMatchObject({ role: UserRole.GYM_OWNER });
    });
  });

  describe('2) registro público solo como USER', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    const validate = (body: Row) =>
      pipe.transform(body, { type: 'body', metatype: RegisterDto });

    it('rechaza (400) un registro que envía role GYM_OWNER o TRAINER', async () => {
      for (const role of ['GYM_OWNER', 'TRAINER', 'ADMIN', 'USER']) {
        await expect(
          validate({
            name: 'X',
            email: 'x@example.com',
            password: 'password123',
            role,
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      }
    });

    it('acepta el registro normal sin role', async () => {
      await expect(
        validate({
          name: 'X',
          email: 'x@example.com',
          password: 'password123',
        }),
      ).resolves.toBeInstanceOf(RegisterDto);
    });

    it('el servicio crea siempre USER aunque le llegue un role', async () => {
      jest
        .spyOn(auth as any, 'generateTokens')
        .mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      db.user.findUnique.mockResolvedValueOnce(null);

      await auth.register({
        name: 'X',
        email: 'x@example.com',
        password: 'password123',
        role: 'GYM_OWNER',
      } as any);

      expect(db.user.create.mock.calls[0][0].data.role).toBe(UserRole.USER);
    });
  });

  describe('3) gestión de administradores', () => {
    beforeEach(() => db.addUser({ id: 'admin-2', role: UserRole.ADMIN }));

    it('un admin no puede bajar de rol a otro admin (403)', async () => {
      await expect(
        users.update(
          'admin-2',
          editBody(db.users.get('admin-2'), { role: UserRole.USER }),
          ADMIN.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.users.get('admin-2').role).toBe(UserRole.ADMIN);
    });

    it('un admin no puede desactivar a otro admin (403)', async () => {
      await expect(
        users.update(
          'admin-2',
          editBody(db.users.get('admin-2'), { isActive: false }),
          ADMIN.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.users.get('admin-2').isActive).toBe(true);
    });

    it('un admin no puede cambiar el correo de otro admin (403)', async () => {
      await expect(
        users.update(
          'admin-2',
          editBody(db.users.get('admin-2'), { email: 'otro@example.com' }),
          ADMIN.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('un admin no puede quitarse su propio rol', async () => {
      await expect(
        users.update(
          ADMIN.id,
          editBody(db.users.get(ADMIN.id), { role: UserRole.USER }),
          ADMIN.id,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('regresión: un admin sí puede editar sus propios datos', async () => {
      await expect(
        users.update(
          ADMIN.id,
          editBody(db.users.get(ADMIN.id), { name: 'Admin Nuevo' }),
          ADMIN.id,
        ),
      ).resolves.toMatchObject({ name: 'Admin Nuevo', role: UserRole.ADMIN });
    });

    it('regresión: un admin puede promover a un usuario a ADMIN (límite 4) sin revocarle nada', async () => {
      db.addUser({ id: 'u8', role: UserRole.GYM_OWNER });
      db.addGym('u8');
      await users.update(
        'u8',
        editBody(db.users.get('u8'), { role: UserRole.ADMIN }),
        ADMIN.id,
      );
      expect(db.users.get('u8').role).toBe(UserRole.ADMIN);
      expect(db.roleRequests).toHaveLength(0);
    });

    it('un admin no puede crear solicitudes de rol (otro admin la aprobaría y le quitaría ADMIN)', async () => {
      await expect(
        users.createRoleRequest('admin-2', UserRole.TRAINER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
