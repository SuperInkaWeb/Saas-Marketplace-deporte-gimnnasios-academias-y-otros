import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { CreateOrderDto } from './dto/marketplace.dto';

// AUD-16: PATCH de productos aceptaba cualquier campo (precio/stock negativos, mover a
// otro gimnasio); los pedidos gratuitos no validaban stock, estado ni gimnasio; y borrar
// un producto con pedidos fallaba con 500.

// Mismas opciones que el ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validateBody = (
  method: keyof MarketplaceController,
  index: number,
  body: unknown,
) => {
  const types = Reflect.getMetadata(
    'design:paramtypes',
    MarketplaceController.prototype,
    method,
  );
  return pipe.transform(body, { type: 'body', metatype: types[index] });
};

describe('AUD-16 · PATCH /marketplace/products/:id valida el cuerpo', () => {
  const patch = (body: unknown) => validateBody('updateProduct', 2, body);

  it('rechaza precio negativo', async () => {
    await expect(patch({ price: -50 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza stock negativo', async () => {
    await expect(patch({ stock: -10 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza gymId (mover el producto a otro gimnasio)', async () => {
    await expect(patch({ gymId: 'otro-gym' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza campos internos (id, createdAt)', async () => {
    await expect(
      patch({ id: 'x', createdAt: '2020-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('regresión: acepta lo que envía el formulario de edición', async () => {
    const body = {
      name: 'Gorra',
      description: '',
      price: 25.5,
      stock: 8,
      category: 'Accesorios',
      imageUrl: 'data:image/png;base64,AAAA',
    };
    await expect(patch(body)).resolves.toMatchObject(body);
  });
});

describe('AUD-16 · updateProduct solo escribe campos permitidos', () => {
  it('no pasa gymId a la base aunque llegue en el objeto', async () => {
    const prisma: any = {
      product: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'p1', gym: { ownerId: 'o1' } }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new MarketplaceService(prisma);
    await service.updateProduct('p1', 'o1', { price: 10, gymId: 'g2' } as any);
    const data = prisma.product.update.mock.calls[0][0].data;
    expect(data.gymId).toBeUndefined();
    expect(data.price).toBe(10);
  });
});

describe('AUD-16 · pedidos gratuitos', () => {
  const product = (over: Record<string, unknown> = {}) => ({
    id: 'p1',
    gymId: 'gA',
    name: 'Muestra',
    price: 0,
    stock: 3,
    isActive: true,
    gym: { status: 'ACTIVE' },
    ...over,
  });

  const build = (p: any, updatedCount = 1) => {
    const tx: any = {
      product: {
        findUnique: jest.fn().mockResolvedValue(p),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: updatedCount }),
      },
      order: { create: jest.fn().mockResolvedValue({ id: 'o1' }) },
    };
    const prisma: any = { $transaction: (fn: any) => fn(tx) };
    return { tx, service: new MarketplaceService(prisma) };
  };

  const order = (gymId: string, quantity: number): CreateOrderDto => ({
    gymId,
    items: [{ productId: 'p1', quantity }],
  });

  it('sin stock suficiente responde 409 y no crea el pedido', async () => {
    const { tx, service } = build(product(), 0);
    await expect(
      service.createOrder('u1', order('gA', 50)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', stock: { gte: 50 } },
      data: { stock: { decrement: 50 } },
    });
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('producto desactivado responde 400', async () => {
    const { tx, service } = build(product({ isActive: false }));
    await expect(
      service.createOrder('u1', order('gA', 1)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('gymId distinto al del producto responde 400', async () => {
    const { tx, service } = build(product());
    await expect(
      service.createOrder('u1', order('gB', 1)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('regresión: pedido válido descuenta stock y crea el pedido en su gimnasio', async () => {
    const { tx, service } = build(product());
    await service.createOrder('u1', order('gA', 2));
    expect(tx.product.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.order.create.mock.calls[0][0].data.gymId).toBe('gA');
  });

  it('rechaza un pedido sin ítems', async () => {
    await expect(
      validateBody('createOrder', 1, { gymId: 'gA', items: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AUD-16 · borrar producto', () => {
  const build = (orderItems: number) => {
    const prisma: any = {
      product: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'p1', gym: { ownerId: 'o1' } }),
        update: jest.fn().mockResolvedValue({ id: 'p1', isActive: false }),
        delete: jest.fn().mockResolvedValue({ id: 'p1' }),
      },
      orderItem: { count: jest.fn().mockResolvedValue(orderItems) },
    };
    return { prisma, service: new MarketplaceService(prisma) };
  };

  it('con pedidos: lo desactiva en vez de borrarlo', async () => {
    const { prisma, service } = build(1);
    await service.deleteProduct('p1', 'o1');
    expect(prisma.product.delete).not.toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isActive: false },
    });
  });

  it('regresión: sin pedidos se borra como antes', async () => {
    const { prisma, service } = build(0);
    await service.deleteProduct('p1', 'o1');
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });
});
