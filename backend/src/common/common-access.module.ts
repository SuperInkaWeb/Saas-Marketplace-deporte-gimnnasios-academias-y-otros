import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GymAccessService } from './gym-access/gym-access.service';
import { AuditService } from './audit/audit.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [GymAccessService, AuditService],
  exports: [GymAccessService, AuditService],
})
export class CommonAccessModule {}