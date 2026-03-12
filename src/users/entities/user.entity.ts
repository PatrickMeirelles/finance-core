import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserToken } from './user.tokens.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { Category } from 'src/categories/entities/category.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column()
  full_name: string;

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

  @OneToMany(() => UserToken, (token) => token.user)
  tokens: UserToken[];

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];
}
