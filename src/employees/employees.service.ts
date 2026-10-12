import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from './entities/employee.entity';
import { User } from '../users/entities/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository:
      Repository<Employee>,

    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
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

  async crear(
    createEmployeeDto: CreateEmployeeDto,
  ) {
    this.validarIdPositivo(
      createEmployeeDto.usuarioId,
      'usuarioId',
    );

    const nombres =
      this.validarTextoObligatorio(
        createEmployeeDto.nombres,
        'El nombre del empleado',
      );

    const puesto =
      this.validarTextoObligatorio(
        createEmployeeDto.puesto,
        'El puesto del empleado',
      );

    const usuario =
      await this.userRepository.findOne({
        where: {
          id: createEmployeeDto.usuarioId,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const empleadoExistente =
      await this.employeeRepository.findOne({
        where: {
          usuario: {
            id: createEmployeeDto.usuarioId,
          },
        },
        relations: {
          usuario: true,
        },
      });

    if (empleadoExistente) {
      throw new BadRequestException(
        'El usuario ya está asociado a un empleado',
      );
    }

    const empleado =
      this.employeeRepository.create({
        nombres,
        puesto,
        usuario,
      });

    const empleadoGuardado =
      await this.employeeRepository.save(
        empleado,
      );

    return {
      id: empleadoGuardado.id,
      nombres: empleadoGuardado.nombres,
      puesto: empleadoGuardado.puesto,
      activo: empleadoGuardado.activo,
      usuario: {
        id: usuario.id,
        usuario: usuario.usuario,
      },
    };
  }

  async obtenerTodos() {
    const empleados =
      await this.employeeRepository.find({
        relations: {
          usuario: true,
        },
        order: {
          id: 'ASC',
        },
      });

    return empleados.map((empleado) => ({
      id: empleado.id,
      nombres: empleado.nombres,
      puesto: empleado.puesto,
      activo: empleado.activo,
      usuario: {
        id: empleado.usuario.id,
        usuario: empleado.usuario.usuario,
      },
    }));
  }

  async actualizar(
    empleadoId: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    this.validarIdPositivo(
      empleadoId,
      'empleadoId',
    );

    const empleado =
      await this.employeeRepository.findOne({
        where: {
          id: empleadoId,
        },
        relations: {
          usuario: true,
        },
      });

    if (!empleado) {
      throw new NotFoundException(
        'Empleado no encontrado',
      );
    }

    if (
      updateEmployeeDto.nombres !== undefined
    ) {
      empleado.nombres =
        this.validarTextoObligatorio(
          updateEmployeeDto.nombres,
          'El nombre del empleado',
        );
    }

    if (
      updateEmployeeDto.puesto !== undefined
    ) {
      empleado.puesto =
        this.validarTextoObligatorio(
          updateEmployeeDto.puesto,
          'El puesto del empleado',
        );
    }

    const empleadoActualizado =
      await this.employeeRepository.save(
        empleado,
      );

    return {
      id: empleadoActualizado.id,
      nombres:
        empleadoActualizado.nombres,
      puesto:
        empleadoActualizado.puesto,
      activo:
        empleadoActualizado.activo,
      usuario: {
        id: empleadoActualizado.usuario.id,
        usuario:
          empleadoActualizado.usuario.usuario,
      },
    };
  }

  async cambiarEstado(
    empleadoId: number,
    activo: boolean,
  ) {
    this.validarIdPositivo(
      empleadoId,
      'empleadoId',
    );

    if (typeof activo !== 'boolean') {
      throw new BadRequestException(
        'activo debe ser un valor booleano',
      );
    }

    const empleado =
      await this.employeeRepository.findOne({
        where: {
          id: empleadoId,
        },
        relations: {
          usuario: true,
        },
      });

    if (!empleado) {
      throw new NotFoundException(
        'Empleado no encontrado',
      );
    }

    empleado.activo = activo;

    const empleadoActualizado =
      await this.employeeRepository.save(
        empleado,
      );

    return {
      id: empleadoActualizado.id,
      nombres:
        empleadoActualizado.nombres,
      puesto:
        empleadoActualizado.puesto,
      activo:
        empleadoActualizado.activo,
      usuario: {
        id: empleadoActualizado.usuario.id,
        usuario:
          empleadoActualizado.usuario.usuario,
      },
    };
  }
}