import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async crear(
    nombre: string,
    descripcion?: string,
  ): Promise<Role> {
    const role = this.rolesRepository.create({
      nombre,
      descripcion,
    });

    return await this.rolesRepository.save(role);
  }

  async obtenerTodos(): Promise<Role[]> {
    return await this.rolesRepository.find();
  }

  async buscarPorNombre(
    nombre: string,
  ): Promise<Role | null> {
    return await this.rolesRepository.findOne({
      where: { nombre },
    });
  }

  async cambiarEstado(
    rolId: number,
    activo: boolean,
  ) {
    const rol = await this.rolesRepository.findOne({
      where: { id: rolId },
    });

    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }

    rol.activo = activo;

    const rolActualizado =
      await this.rolesRepository.save(rol);

    return {
      id: rolActualizado.id,
      nombre: rolActualizado.nombre,
      descripcion: rolActualizado.descripcion,
      activo: rolActualizado.activo,
    };
  }
}