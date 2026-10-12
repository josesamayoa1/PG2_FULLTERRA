import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tipos_actividad')
export class ActivityType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  nombre: string;

  @Column({
    nullable: true,
  })
  descripcion: string;

  @Column()
  categoria: string;

  @Column({
    default: true,
  })
  activo: boolean;
}