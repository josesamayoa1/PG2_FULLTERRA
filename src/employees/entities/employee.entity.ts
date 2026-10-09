import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('empleados')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombres: string;

  @Column()
  puesto: string;

  @Column({ default: true })
  activo: boolean;

  @OneToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}