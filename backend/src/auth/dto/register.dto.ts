import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  // AUD-18: ya no se acepta `role`. Con forbidNonWhitelisted, enviarlo responde 400.
  // Toda cuenta nueva es USER; los demás roles se piden con /users/role-requests.

  @ApiProperty({ example: '+573001234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
