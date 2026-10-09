import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Unit } from '../../units/entities/unit.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { ActivityType } from '../../activity-types/entities/activity-type.entity';

@Entity('operaciones_activos')
export class AssetOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Unit, {
    nullable: false,
  })
  @JoinColumn({
    name: 'unidad_id',
  })
  unidad: Unit;

  @ManyToOne(() => Employee, {
    nullable: false,
  })
  @JoinColumn({
    name: 'empleado_id',
  })
  empleado: Employee;

  @ManyToOne(() => ActivityType, {
    nullable: false,
  })
  @JoinColumn({
    name: 'tipo_actividad_id',
  })
  tipoActividad: ActivityType;

  @Column({
    type: 'date',
    name: 'fecha_operacion',
  })
  fechaOperacion: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'horas_uso',
    nullable: true,
  })
  horasUso: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  viajes: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  kilometros: number | null;

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