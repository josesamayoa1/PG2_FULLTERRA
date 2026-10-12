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
    private readonly userRepository:
      Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository:
      Repository<Role>,
  ) {}

  private validarIdPositivo(
    valor: number,
    nombreCampo: string,
  ) {
    if (
      !Number.isInteger(valor) ||
      valor <= 0
    ) {
      throw new BadRequestException(
        `${nombreCampo} debe ser un número entero mayor que cero`,
      );
    }
  }

  private validarTextoObligatorio(
    valor: string,
    nombreCampo: string,
  ) {
    if (
      typeof valor !== 'string' ||
      valor.trim().length === 0
    ) {
      throw new BadRequestException(
        `${nombreCampo} es obligatorio`,
      );
    }

    return valor.trim();
  }

  private validarContrasenia(
    contrasenia: string,
  ) {
    if (
      typeof contrasenia !== 'string' ||
      contrasenia.trim().length === 0
    ) {
      throw new BadRequestException(
        'La contraseña es obligatoria',
      );
    }

    return contrasenia;
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<User> {
    const usuario =
      this.validarTextoObligatorio(
        createUserDto.usuario,
        'El nombre de usuario',
      );

    const contrasenia =
      this.validarContrasenia(
        createUserDto.contrasenia,
      );

    const usuarioExistente =
      await this.findByUsuario(usuario);

    if (usuarioExistente) {
      throw new BadRequestException(
        'El nombre de usuario ya está registrado',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        contrasenia,
        10,
      );

    const user =
      this.userRepository.create({
        usuario,
        contrasenia: hashedPassword,
      });

    return this.userRepository.save(user);
  }

  async findByUsuario(
    usuario: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        usuario,
      },
      relations: {
        roles: true,
      },
    });
  }

  async asignarRoles(
    usuarioId: number,
    rolesIds: number[],
  ) {
    this.validarIdPositivo(
      usuarioId,
      'usuarioId',
    );

    if (!Array.isArray(rolesIds)) {
      throw new BadRequestException(
        'roles debe ser un arreglo',
      );
    }

    for (const rolId of rolesIds) {
      this.validarIdPositivo(
        rolId,
        'rolId',
      );
    }

    const usuario =
      await this.userRepository.findOne({
        where: {
          id: usuarioId,
        },
        relations: {
          roles: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const idsUnicos = [
      ...new Set(rolesIds),
    ];

    const roles =
      idsUnicos.length > 0
        ? await this.roleRepository.find({
            where: {
              id: In(idsUnicos),
              activo: true,
            },
          })
        : [];

    if (
      roles.length !== idsUnicos.length
    ) {
      throw new BadRequestException(
        'Uno o más roles no existen o están inactivos',
      );
    }

    usuario.roles = roles;

    const usuarioActualizado =
      await this.userRepository.save(
        usuario,
      );

    return {
      id: usuarioActualizado.id,
      usuario:
        usuarioActualizado.usuario,
      roles:
        usuarioActualizado.roles,
    };
  }

  async cambiarEstado(
    usuarioId: number,
    activo: boolean,
  ) {
    this.validarIdPositivo(
      usuarioId,
      'usuarioId',
    );

    if (typeof activo !== 'boolean') {
      throw new BadRequestException(
        'activo debe ser un valor booleano',
      );
    }

    const usuario =
      await this.userRepository.findOne({
        where: {
          id: usuarioId,
        },
        relations: {
          roles: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    usuario.activo = activo;

    const usuarioActualizado =
      await this.userRepository.save(
        usuario,
      );

    return {
      id: usuarioActualizado.id,
      usuario:
        usuarioActualizado.usuario,
      activo:
        usuarioActualizado.activo,
      roles:
        usuarioActualizado.roles,
    };
  }

  async obtenerTodos() {
    const usuarios =
      await this.userRepository.find({
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
    this.validarIdPositivo(
      usuarioId,
      'usuarioId',
    );

    const usuario =
      await this.userRepository.findOne({
        where: {
          id: usuarioId,
        },
        relations: {
          roles: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (
      updateUserDto.usuario !== undefined
    ) {
      const nuevoUsuario =
        this.validarTextoObligatorio(
          updateUserDto.usuario,
          'El nombre de usuario',
        );

      if (
        nuevoUsuario !== usuario.usuario
      ) {
        const usuarioExistente =
          await this.findByUsuario(
            nuevoUsuario,
          );

        if (
          usuarioExistente &&
          usuarioExistente.id !==
            usuarioId
        ) {
          throw new BadRequestException(
            'El nombre de usuario ya está registrado',
          );
        }

        usuario.usuario = nuevoUsuario;
      }
    }

    if (
      updateUserDto.contrasenia !==
      undefined
    ) {
      const nuevaContrasenia =
        this.validarContrasenia(
          updateUserDto.contrasenia,
        );

      usuario.contrasenia =
        await bcrypt.hash(
          nuevaContrasenia,
          10,
        );
    }

    const usuarioActualizado =
      await this.userRepository.save(
        usuario,
      );

    return {
      id: usuarioActualizado.id,
      usuario:
        usuarioActualizado.usuario,
      activo:
        usuarioActualizado.activo,
      roles:
        usuarioActualizado.roles,
    };
  }
}