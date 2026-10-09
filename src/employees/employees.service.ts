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
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async crear(createEmployeeDto: CreateEmployeeDto) {
    const usuario = await this.userRepository.findOne({
      where: { id: createEmployeeDto.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
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

    const empleado = this.employeeRepository.create({
      nombres: createEmployeeDto.nombres,
      puesto: createEmployeeDto.puesto,
      usuario,
    });

    const empleadoGuardado =
      await this.employeeRepository.save(empleado);

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
    const empleados = await this.employeeRepository.find({
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
    const empleado = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: {
        usuario: true,
      },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    if (updateEmployeeDto.nombres !== undefined) {
      empleado.nombres = updateEmployeeDto.nombres;
    }

    if (updateEmployeeDto.puesto !== undefined) {
      empleado.puesto = updateEmployeeDto.puesto;
    }

    const empleadoActualizado =
      await this.employeeRepository.save(empleado);

    return {
      id: empleadoActualizado.id,
      nombres: empleadoActualizado.nombres,
      puesto: empleadoActualizado.puesto,
      activo: empleadoActualizado.activo,
      usuario: {
        id: empleadoActualizado.usuario.id,
        usuario: empleadoActualizado.usuario.usuario,
      },
    };
  }

  async cambiarEstado(
    empleadoId: number,
    activo: boolean,
  ) {
    const empleado = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: {
        usuario: true,
      },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    empleado.activo = activo;

    const empleadoActualizado =
      await this.employeeRepository.save(empleado);

    return {
      id: empleadoActualizado.id,
      nombres: empleadoActualizado.nombres,
      puesto: empleadoActualizado.puesto,
      activo: empleadoActualizado.activo,
      usuario: {
        id: empleadoActualizado.usuario.id,
        usuario: empleadoActualizado.usuario.usuario,
      },
    };
  }
}