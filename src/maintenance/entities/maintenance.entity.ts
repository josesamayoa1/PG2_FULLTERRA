import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Unit } from '../../units/entities/unit.entity';

@Entity('mantenimientos')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Unit, {
    nullable: false,
  })
  @JoinColumn({
    name: 'unidad_id',
  })
  unidad: Unit;

  @Column({
    name: 'tipo_mantenimiento',
  })
  tipoMantenimiento: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  observaciones: string | null;

  @Column({
    type: 'date',
    name: 'fecha_mantenimiento',
  })
  fechaMantenimiento: string;

  @Column({
    type: 'date',
    name: 'proximo_servicio',
    nullable: true,
  })
  proximoServicio: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'kilometraje_horas',
    nullable: true,
  })
  kilometrajeHoras: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costo: number | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  taller: string | null;

  @Column({
    default: 'REGISTRADO',
  })
  estado: string;
}