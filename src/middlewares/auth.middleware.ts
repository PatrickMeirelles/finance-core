import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { verifyToken } from '../common/utils/jwt.util';
import {
  BEARER_PREFIX,
  INVALID_TOKEN_MESSAGE,
} from '../common/constants/security.constants';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = AuthMiddleware.bearerToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Authorization header not provided');
    }

    const payload = await verifyToken(this.jwtService, token, 'access');
    if (!payload) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    req.user = await this.usersService.getUserInformationByToken(token);
    next();
  }

  static bearerToken(header: string | undefined): string | null {
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (scheme !== BEARER_PREFIX || !token) return null;
    return token;
  }
}
