import * as fs from 'fs';
import * as path from 'path';

const PRISMA_DIR = path.resolve(__dirname, '../../prisma');
const MIGRATIONS_DIR = path.join(PRISMA_DIR, 'migrations');
const RENDER_YAML = path.resolve(__dirname, '../../../render.yaml');

function migrationDirs(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function allMigrationsSql(): string {
  return migrationDirs()
    .map((dir) =>
      fs.readFileSync(path.join(MIGRATIONS_DIR, dir, 'migration.sql'), 'utf8'),
    )
    .join('\n');
}

// Nombre real en la BD de cada model/enum del schema (respeta @@map).
function schemaObjects(kind: 'model' | 'enum'): string[] {
  const schema = fs.readFileSync(
    path.join(PRISMA_DIR, 'schema.prisma'),
    'utf8',
  );
  const blocks = schema.matchAll(
    new RegExp(`^${kind}\\s+(\\w+)\\s*\\{([\\s\\S]*?)^\\}`, 'gm'),
  );
  return [...blocks].map(([, name, body]) => {
    const mapped = body.match(/@@map\("([^"]+)"\)/);
    return mapped ? mapped[1] : name;
  });
}

function renderStartCommand(): string {
  const yaml = fs.readFileSync(RENDER_YAML, 'utf8');
  const backend = yaml
    .split(/^\s*- type:/m)
    .find((s) => /name:\s*sportnexus-backend/.test(s));
  const line = backend?.match(/^\s*startCommand:\s*(.+)$/m);
  if (!line)
    throw new Error('render.yaml: startCommand del backend no encontrado');
  return line[1].trim();
}

describe('Migraciones y arranque de producción (AUD-04)', () => {
  it('el arranque no modifica el schema de la base', () => {
    const cmd = renderStartCommand();
    expect(cmd).not.toMatch(/db\s+push/);
    expect(cmd).not.toMatch(/accept-data-loss/);
    expect(cmd).not.toMatch(/migrate/);
    expect(cmd).toBe('node dist/src/main');
  });

  it('existe migration_lock.toml con provider postgresql', () => {
    const lock = fs.readFileSync(
      path.join(MIGRATIONS_DIR, 'migration_lock.toml'),
      'utf8',
    );
    expect(lock).toMatch(/provider\s*=\s*"postgresql"/);
  });

  it('ninguna migración tiene fecha futura ni nombre fuera de formato', () => {
    const now = Date.now();
    for (const dir of migrationDirs()) {
      const m = dir.match(
        /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_[a-z0-9_]+$/,
      );
      expect(m).not.toBeNull();
      const [, y, mo, d, h, mi, s] = m!.map(Number);
      expect(Date.UTC(y, mo - 1, d, h, mi, s)).toBeLessThanOrEqual(now);
    }
  });

  it('las migraciones crean todas las tablas del schema', () => {
    const sql = allMigrationsSql();
    const missing = schemaObjects('model').filter(
      (t) => !sql.includes(`CREATE TABLE "${t}"`),
    );
    expect(missing).toEqual([]);
  });

  it('las migraciones crean todos los enums del schema', () => {
    const sql = allMigrationsSql();
    const missing = schemaObjects('enum').filter(
      (e) => !sql.includes(`CREATE TYPE "${e}"`),
    );
    expect(missing).toEqual([]);
  });
});
