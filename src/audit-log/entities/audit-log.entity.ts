import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('bitacora_operaciones')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({
    name: 'usuario_id',
  })
  usuario: User;

  @Column({
    type: 'varchar',
    length: 50,
  })
  accion: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  modulo: string;

  @Column({
    type: 'int',
    name: 'registro_id',
    nullable: true,
  })
  registroId: number | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  detalle: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_accion',
  })
  fechaAccion: Date;
}