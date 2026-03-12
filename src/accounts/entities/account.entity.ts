import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PaymentMethod } from './enum/payment-method.enum';

@Index(['user_id', 'is_active'])
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Index(['user_id'])
  @Column()
  user_id: number;

  @Column()
  name: string;

  @Index(['type'])
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  type: PaymentMethod;

  @Column()
  balance: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  closing_day: number;

  @Column({ nullable: true })
  due_day: number;

  @Column({ nullable: true })
  credit_limit: number;

  @Column({ type: Date, default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: Date,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.accounts)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
