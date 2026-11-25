import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Auth0JwtStrategy } from './strategies/auth0-jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ||
            '15m') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    Auth0JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
