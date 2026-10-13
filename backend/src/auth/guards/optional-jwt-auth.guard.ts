import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Si no hay token o es inválido, no lanza error: user queda undefined
  handleRequest(err: any, user: any) {
    return user || null;
  }
}