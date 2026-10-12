import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('unidades')
export class Unit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  codigo: string;

  @Column()
  tipo: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column({
    name: 'placa_o_serie',
    unique: true,
  })
  placaOSerie: string;

  @Column({
    default: 'DISPONIBLE',
  })
  estado: string;

  @Column({
    default: true,
  })
  activo: boolean;
}