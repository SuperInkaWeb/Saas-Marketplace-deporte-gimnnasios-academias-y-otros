import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InvoicesService.getInvoiceById (HER-SEC-003)', () => {
  let service: InvoicesService;
  let findUniqueMock: jest.Mock;

  const invoice = {
    id: 'inv-1',
    userId: 'owner-of-invoice',
    gym: { name: 'Gym X', phone: '111', address: 'Calle 1', ownerId: 'gym-owner-1' },
  };

  beforeEach(() => {
    findUniqueMock = jest.fn().mockResolvedValue(invoice);
    const prisma = {
      invoice: { findUnique: findUniqueMock },
    } as unknown as PrismaService;

    service = new InvoicesService(prisma);
  });

  it('rejects a user unrelated to the invoice or the gym', async () => {
    await expect(
      service.getInvoiceById('inv-1', 'otro-usuario', UserRole.USER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows the user the invoice belongs to', async () => {
    const result = await service.getInvoiceById(
      'inv-1',
      'owner-of-invoice',
      UserRole.USER,
    );
    expect(result.id).toBe('inv-1');
  });

  it('allows the owner of the gym the invoice belongs to', async () => {
    const result = await service.getInvoiceById(
      'inv-1',
      'gym-owner-1',
      UserRole.GYM_OWNER,
    );
    expect(result.id).toBe('inv-1');
  });

  it('allows ADMIN regardless of ownership', async () => {
    const result = await service.getInvoiceById(
      'inv-1',
      'cualquiera',
      UserRole.ADMIN,
    );
    expect(result.id).toBe('inv-1');
  });

  it('does not leak the gym ownerId in the response', async () => {
    const result = await service.getInvoiceById(
      'inv-1',
      'owner-of-invoice',
      UserRole.USER,
    );
    expect(result.gym).not.toHaveProperty('ownerId');
  });

  it('throws NotFoundException when the invoice does not exist', async () => {
    findUniqueMock.mockResolvedValue(null);
    await expect(
      service.getInvoiceById('no-existe', 'quien-sea', UserRole.USER),
    ).rejects.toThrow(NotFoundException);
  });
});
