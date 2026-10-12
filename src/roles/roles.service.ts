import {
  BadRequestException,
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

  async crear(nombre: string, descripcion?: string): Promise<Role> {
    const nombreLimpio = this.validarNombre(nombre);
    const existente = await this.buscarPorNombre(nombreLimpio);
    if (existente) {
      throw new BadRequestException('El nombre del rol ya está registrado');
    }
    const role = this.rolesRepository.create({
      nombre: nombreLimpio,
      descripcion,
    });
    return this.rolesRepository.save(role);
  }

  async obtenerTodos(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async buscarPorNombre(nombre: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { nombre } });
  }

  private validarNombre(nombre: string): string {
    if (typeof nombre !== 'string' || !nombre.trim()) {
      throw new BadRequestException('El nombre del rol es obligatorio');
    }
    return nombre.trim();
  }

  async actualizar(rolId: number, nombre?: string, descripcion?: string) {
    const rol = await this.rolesRepository.findOne({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    if (nombre !== undefined) {
      const nombreLimpio = this.validarNombre(nombre);
      if (rol.nombre === 'Administrador' && nombreLimpio !== rol.nombre) {
        throw new BadRequestException(
          'No se puede cambiar el nombre del rol Administrador',
        );
      }
      if (nombreLimpio === 'Administrador' && rol.nombre !== 'Administrador') {
        throw new BadRequestException(
          'El nombre Administrador está reservado para el rol del sistema',
        );
      }
      if (nombreLimpio !== rol.nombre) {
        const existente = await this.buscarPorNombre(nombreLimpio);
        if (existente && existente.id !== rolId) {
          throw new BadRequestException('El nombre del rol ya está registrado');
        }
        rol.nombre = nombreLimpio;
      }
    }

    if (descripcion !== undefined) rol.descripcion = descripcion;
    const actualizado = await this.rolesRepository.save(rol);
    return {
      id: actualizado.id,
      nombre: actualizado.nombre,
      descripcion: actualizado.descripcion,
      activo: actualizado.activo,
    };
  }

  async cambiarEstado(rolId: number, activo: boolean) {
    if (typeof activo !== 'boolean') {
      throw new BadRequestException('activo debe ser un valor booleano');
    }
    const rol = await this.rolesRepository.findOne({ where: { id: rolId } });
    if (!rol) throw new NotFoundException('Rol no encontrado');

    if (rol.nombre === 'Administrador' && !activo) {
      throw new BadRequestException(
        'No se puede desactivar el rol Administrador',
      );
    }

    rol.activo = activo;
    const actualizado = await this.rolesRepository.save(rol);
    return {
      id: actualizado.id,
      nombre: actualizado.nombre,
      descripcion: actualizado.descripcion,
      activo: actualizado.activo,
    };
  }
}
