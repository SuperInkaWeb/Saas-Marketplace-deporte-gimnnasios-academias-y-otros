import { AuthController } from './auth.controller';

describe('AuthController — HER-SEC-001 (endpoints públicos de seed/purga eliminados)', () => {
  it('no expone seed70AthletesSecret, seedMarioDbSecret, seedStatus ni purgeProductionDataSecure', () => {
    const methods = Object.getOwnPropertyNames(AuthController.prototype);

    expect(methods).not.toContain('seed70AthletesSecret');
    expect(methods).not.toContain('seedMarioDbSecret');
    expect(methods).not.toContain('seedStatus');
    expect(methods).not.toContain('purgeProductionDataSecure');
  });
});
