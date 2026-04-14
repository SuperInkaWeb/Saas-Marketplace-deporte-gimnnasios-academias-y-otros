import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GymsModule } from '../gyms/gyms.module';

@Module({
  imports: [PrismaModule, NotificationsModule, GymsModule],
  controllers: [MarketingController],
  providers: [MarketingService]
})
export class MarketingModule {}
