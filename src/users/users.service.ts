import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(
      createUserDto.contrasenia,
      10,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      contrasenia: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findByUsuario(usuario: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { usuario },
      relations: {
        roles: true,
      },
    });
  }

  async asignarRoles(usuarioId: number, rolesIds: number[]) {
    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: {
        roles: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const idsUnicos = [...new Set(rolesIds)];

    const roles =
      idsUnicos.length > 0
        ? await this.roleRepository.find({
            where: {
              id: In(idsUnicos),
            },
          })
        : [];

    if (roles.length !== idsUnicos.length) {
      throw new BadRequestException(
        'Uno o más roles enviados no existen',
      );
    }

    usuario.roles = roles;

    const usuarioActualizado =
      await this.userRepository.save(usuario);

    return {
      id: usuarioActualizado.id,
      usuario: usuarioActualizado.usuario,
      roles: usuarioActualizado.roles,
    };
  }

  async cambiarEstado(usuarioId: number, activo: boolean) {
    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: {
        roles: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    usuario.activo = activo;

    const usuarioActualizado =
      await this.userRepository.save(usuario);

    return {
      id: usuarioActualizado.id,
      usuario: usuarioActualizado.usuario,
      activo: usuarioActualizado.activo,
      roles: usuarioActualizado.roles,
    };
  }

  async obtenerTodos() {
    const usuarios = await this.userRepository.find({
      relations: {
        roles: true,
      },
      order: {
        id: 'ASC',
      },
    });

    return usuarios.map((usuario) => ({
      id: usuario.id,
      usuario: usuario.usuario,
      activo: usuario.activo,
      roles: usuario.roles,
    }));
  }

  async actualizar(
    usuarioId: number,
    updateUserDto: UpdateUserDto,
  ) {
    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: {
        roles: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (
      updateUserDto.usuario &&
      updateUserDto.usuario !== usuario.usuario
    ) {
      const usuarioExistente = await this.findByUsuario(
        updateUserDto.usuario,
      );

      if (
        usuarioExistente &&
        usuarioExistente.id !== usuarioId
      ) {
        throw new BadRequestException(
          'El nombre de usuario ya está registrado',
        );
      }

      usuario.usuario = updateUserDto.usuario;
    }

    if (updateUserDto.contrasenia) {
      usuario.contrasenia = await bcrypt.hash(
        updateUserDto.contrasenia,
        10,
      );
    }

    const usuarioActualizado =
      await this.userRepository.save(usuario);

    return {
      id: usuarioActualizado.id,
      usuario: usuarioActualizado.usuario,
      activo: usuarioActualizado.activo,
      roles: usuarioActualizado.roles,
    };
  }
}