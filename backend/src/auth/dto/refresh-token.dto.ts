import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** AUD-24: cuerpo de POST /auth/refresh. Si falta un campo responde 400 (antes era un 500). */
export class RefreshTokenDto {
  @ApiProperty({ description: 'Id del usuario dueño del refresh token' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  userId: string;

  @ApiProperty({
    description: 'Refresh token recibido en el login o en el último refresh',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  refreshToken: string;
}

/** AUD-24: cuerpo de POST /auth/logout. */
export class LogoutDto {
  @ApiProperty({ description: 'Refresh token que se quiere invalidar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  refreshToken: string;
}
