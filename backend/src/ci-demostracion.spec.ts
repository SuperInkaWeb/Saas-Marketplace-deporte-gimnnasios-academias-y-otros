// TEMPORAL (AUD-31): prueba rota a propósito para demostrar que la CI la detecta. Se revierte antes del merge.
describe('Demostración de CI', () => {
  it('debe fallar a propósito', () => {
    expect(1 + 1).toBe(3);
  });
});
