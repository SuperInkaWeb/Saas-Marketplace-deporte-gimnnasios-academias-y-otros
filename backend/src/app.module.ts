import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// Future modules:
// import { UsersModule } from './users/users.module';
import { GymsModule } from './gyms/gyms.module';
import { TrainersModule } from './trainers/trainers.module';
import { ClassesModule } from './classes/classes.module';
import { MembershipsModule } from './memberships/memberships.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { EventsModule } from './events/events.module';
import { RecommendationsModule } from './recommendations/recommendations.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    GymsModule,
    TrainersModule,
    ClassesModule,
    MembershipsModule,
    MarketplaceModule,
    ProfessionalsModule,
    EventsModule,
    RecommendationsModule,
  ],




  controllers: [AppController],
  providers: [],
})
export class AppModule {}

