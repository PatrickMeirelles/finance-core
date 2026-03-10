import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: 'Authorization header not provided' });
    }
    const token = authHeader.split(' ')[1];
    const getUserFromToken =
      await this.usersService.getUserInformationByToken(token);

    req.user = getUserFromToken;
    next();
  }
}
