import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { Role } from '../../roles/entities/role.entity';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario: string;

  @Column()
  contrasenia: string;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'usuarios_roles',
    joinColumn: {
      name: 'usuario_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'rol_id',
      referencedColumnName: 'id',
    },
  })
  roles: Role[];
}