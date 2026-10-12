import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Unit } from '../../units/entities/unit.entity';
import { User } from '../../users/entities/user.entity';

@Entity('combustible')
export class FuelLoad {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Unit, {
    nullable: false,
  })
  @JoinColumn({
    name: 'unidad_id',
  })
  unidad: Unit;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({
    name: 'usuario_id',
  })
  usuario: User;

  @Column({
    type: 'date',
    name: 'fecha_carga',
  })
  fechaCarga: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  galones: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  observaciones: string | null;

  @Column({
    default: 'ACTIVO',
  })
  estado: string;
}