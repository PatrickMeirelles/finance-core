import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('idx_password_reset_active', ['expires_at', 'used_at'])
@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: number;

  @Column()
  token_hash: string;

  @Index()
  @Column({ type: Date })
  expires_at: Date;

  @Column({ type: Date, nullable: true })
  used_at: Date | null;

  @Column({ type: Date, default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: Date,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
