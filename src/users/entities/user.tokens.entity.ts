import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * One row per session. Only digests of the tokens are stored, so a database
 * leak does not hand out usable credentials.
 */
@Entity('users_tokens')
export class UserToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index(['user_id', 'is_active'])
  @Column()
  user_id: number;

  @Index({ unique: true })
  @Column()
  access_token_hash: string;

  @Index(['expires_at_access_token'])
  @Column()
  expires_at_access_token: Date;

  @Index({ unique: true })
  @Column()
  refresh_token_hash: string;

  @Column()
  expires_at_refresh_token: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: Date, default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: Date,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.tokens)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
