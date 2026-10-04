import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ClassesModule } from '../classes/classes.module';
import { ProfessionalsModule } from '../professionals/professionals.module';

@Module({
  imports: [PrismaModule, MembershipsModule, ClassesModule, ProfessionalsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}