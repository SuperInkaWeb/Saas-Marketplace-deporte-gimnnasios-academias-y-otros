import { Module } from '@nestjs/common';
import { WearablesController } from './wearables.controller';
import { WearablesService } from './wearables.service';
import { GoogleHealthService } from './google-health.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenCipher } from '../common/security/token-cipher';

@Module({
  imports: [PrismaModule],
  controllers: [WearablesController],
  // TokenCipher lee TOKEN_ENCRYPTION_KEY al arrancar; una clave mal formada detiene el arranque (AUD-15)
  providers: [WearablesService, GoogleHealthService, { provide: TokenCipher, useFactory: () => new TokenCipher() }],
  exports: [GoogleHealthService, WearablesService],
})
export class WearablesModule {}
