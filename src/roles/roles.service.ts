import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async crear(nombre: string, descripcion?: string): Promise<Role> {
    const role = this.rolesRepository.create({
      nombre,
      descripcion,
    });

    return await this.rolesRepository.save(role);
  }

  async obtenerTodos(): Promise<Role[]> {
    return await this.rolesRepository.find();
  }

  async buscarPorNombre(nombre: string): Promise<Role | null> {
    return await this.rolesRepository.findOne({
      where: { nombre },
    });
  }
}