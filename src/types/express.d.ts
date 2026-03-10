import { User as UserEntity } from '../users/entities/user.entity';

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: UserEntity;
    }
  }
}
