import { Account } from 'src/accounts/entities/account.entity';
import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionStatus } from './enum/transactions-status.enum';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';

@Index(['user_id', 'transaction_date'])
@Index(['account_id'])
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Index(['user_id'])
  @Column()
  user_id: number;

  @Column()
  account_id: number;

  @Column()
  category_id: number;

  @Column({
    type: 'integer',
    transformer: {
      to: (value: number) => value * 100,
      from: (value: number) => value / 100,
    },
  })
  value: number;

  @Column({ type: 'enum', enum: IncomeExpensive })
  type: IncomeExpensive;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column()
  transaction_date: Date;

  @Column()
  installment: number;

  @Column()
  amount_installments: number;

  @Column()
  installments_group_id: string;

  @Column({ nullable: true })
  destination_account_id: number;

  @Column()
  description: string;

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

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Account, (account) => account.id)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Category, (category) => category.id)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
