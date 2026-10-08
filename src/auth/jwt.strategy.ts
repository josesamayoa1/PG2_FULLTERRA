import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: number;
    usuario: string;
    roles: string[];
  }) {
    const user = await this.usersService.findByUsuario(
      payload.usuario,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Usuario no encontrado',
      );
    }

    if (!user.activo) {
      throw new UnauthorizedException(
        'Usuario inactivo',
      );
    }

    return {
      id: user.id,
      usuario: user.usuario,
      roles: user.roles
        .filter((role) => role.activo)
        .map((role) => role.nombre),
    };
  }
}