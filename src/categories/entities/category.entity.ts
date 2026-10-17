import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import { enumColumnType } from 'src/common/utils/enum-column.util';

@Index(['user_id', 'type'])
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Index(['user_id'])
  @Column()
  user_id: number;

  @Column()
  name: string;

  @Column({
    type: enumColumnType(),
    enum: IncomeExpensive,
  })
  type: IncomeExpensive;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

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

  @ManyToOne(() => User, (user) => user.categories)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
