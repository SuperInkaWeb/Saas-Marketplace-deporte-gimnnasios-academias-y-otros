import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ClassCheckoutDto,
  ConfirmPaymentDto,
  OrderCheckoutDto,
  ServiceCheckoutDto,
} from './checkout.dto';

const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const check = (cls: any, plain: any) =>
  validate(plainToInstance(cls, plain), { whitelist: true, forbidNonWhitelisted: true });

describe('Checkout DTOs', () => {
  it('ClassCheckoutDto: rechaza cuerpo vacío', async () => {
    expect((await check(ClassCheckoutDto, {})).length).toBeGreaterThan(0);
  });
  it('ClassCheckoutDto: rechaza un id que no es UUID', async () => {
    expect((await check(ClassCheckoutDto, { classId: 'abc' })).length).toBeGreaterThan(0);
  });
  it('ClassCheckoutDto: rechaza campos extra', async () => {
    expect((await check(ClassCheckoutDto, { classId: UUID, price: 0 })).length).toBeGreaterThan(0);
  });
  it('ClassCheckoutDto: acepta un UUID válido', async () => {
    expect(await check(ClassCheckoutDto, { classId: UUID })).toHaveLength(0);
  });

  it('ServiceCheckoutDto: rechaza notas de más de 500 caracteres', async () => {
    const errors = await check(ServiceCheckoutDto, { serviceId: UUID, notes: 'x'.repeat(501) });
    expect(errors.length).toBeGreaterThan(0);
  });
  it('ServiceCheckoutDto: acepta sin notas', async () => {
    expect(await check(ServiceCheckoutDto, { serviceId: UUID })).toHaveLength(0);
  });

  it('OrderCheckoutDto: rechaza carrito vacío', async () => {
    expect((await check(OrderCheckoutDto, { items: [] })).length).toBeGreaterThan(0);
  });
  it('OrderCheckoutDto: rechaza cantidad 0 y decimales', async () => {
    expect((await check(OrderCheckoutDto, { items: [{ productId: UUID, quantity: 0 }] })).length).toBeGreaterThan(0);
    expect((await check(OrderCheckoutDto, { items: [{ productId: UUID, quantity: 1.5 }] })).length).toBeGreaterThan(0);
  });
  it('OrderCheckoutDto: acepta un carrito válido', async () => {
    expect(await check(OrderCheckoutDto, { items: [{ productId: UUID, quantity: 2 }] })).toHaveLength(0);
  });

  it('ConfirmPaymentDto: rechaza ids no numéricos', async () => {
    expect((await check(ConfirmPaymentDto, { paymentId: 'abc' })).length).toBeGreaterThan(0);
  });
  it('ConfirmPaymentDto: acepta un id numérico', async () => {
    expect(await check(ConfirmPaymentDto, { paymentId: '123456789' })).toHaveLength(0);
  });
});