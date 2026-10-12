import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Maintenance } from './entities/maintenance.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { Unit } from '../units/entities/unit.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository:
      Repository<Maintenance>,

    @InjectRepository(Unit)
    private readonly unitRepository:
      Repository<Unit>,
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

  private validarFecha(
    fecha: string,
    nombreCampo: string,
  ) {
    if (
      typeof fecha !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
      throw new BadRequestException(
        `${nombreCampo} debe tener el formato YYYY-MM-DD`,
      );
    }

    const [anio, mes, dia] = fecha
      .split('-')
      .map(Number);

    const fechaConvertida = new Date(
      Date.UTC(anio, mes - 1, dia),
    );

    const fechaValida =
      fechaConvertida.getUTCFullYear() ===
        anio &&
      fechaConvertida.getUTCMonth() ===
        mes - 1 &&
      fechaConvertida.getUTCDate() === dia;

    if (!fechaValida) {
      throw new BadRequestException(
        `${nombreCampo} no es válida`,
      );
    }
  }

  async registrar(
    createMaintenanceDto:
      CreateMaintenanceDto,
  ) {
    this.validarIdPositivo(
      createMaintenanceDto.unidadId,
      'unidadId',
    );

    if (
      typeof createMaintenanceDto
        .tipoMantenimiento !== 'string' ||
      createMaintenanceDto.tipoMantenimiento
        .trim()
        .length === 0
    ) {
      throw new BadRequestException(
        'El tipo de mantenimiento es obligatorio',
      );
    }

    this.validarFecha(
      createMaintenanceDto.fechaMantenimiento,
      'La fecha de mantenimiento',
    );

    if (
      createMaintenanceDto.proximoServicio !==
        undefined &&
      createMaintenanceDto.proximoServicio !==
        ''
    ) {
      this.validarFecha(
        createMaintenanceDto.proximoServicio,
        'La fecha del próximo servicio',
      );
    }

    if (
      createMaintenanceDto.kilometrajeHoras !==
        undefined &&
      (
        typeof createMaintenanceDto
          .kilometrajeHoras !== 'number' ||
        !Number.isFinite(
          createMaintenanceDto
            .kilometrajeHoras,
        ) ||
        createMaintenanceDto.kilometrajeHoras <
          0
      )
    ) {
      throw new BadRequestException(
        'El kilometraje u horas debe ser un número mayor o igual que cero',
      );
    }

    if (
      createMaintenanceDto.costo !== undefined &&
      (
        typeof createMaintenanceDto.costo !==
          'number' ||
        !Number.isFinite(
          createMaintenanceDto.costo,
        ) ||
        createMaintenanceDto.costo < 0
      )
    ) {
      throw new BadRequestException(
        'El costo debe ser un número mayor o igual que cero',
      );
    }

    const unidad =
      await this.unitRepository.findOne({
        where: {
          id: createMaintenanceDto.unidadId,
        },
      });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad no encontrada',
      );
    }

    const mantenimiento =
      this.maintenanceRepository.create({
        unidad,
        tipoMantenimiento:
          createMaintenanceDto.tipoMantenimiento.trim(),
        observaciones:
          createMaintenanceDto.observaciones ??
          null,
        fechaMantenimiento:
          createMaintenanceDto.fechaMantenimiento,
        proximoServicio:
          createMaintenanceDto.proximoServicio ||
          null,
        kilometrajeHoras:
          createMaintenanceDto.kilometrajeHoras ??
          null,
        costo:
          createMaintenanceDto.costo ?? null,
        taller:
          createMaintenanceDto.taller ?? null,
        estado: 'REGISTRADO',
      });

    const mantenimientoGuardado =
      await this.maintenanceRepository.save(
        mantenimiento,
      );

    return {
      id: mantenimientoGuardado.id,
      tipoMantenimiento:
        mantenimientoGuardado.tipoMantenimiento,
      observaciones:
        mantenimientoGuardado.observaciones,
      fechaMantenimiento:
        mantenimientoGuardado.fechaMantenimiento,
      proximoServicio:
        mantenimientoGuardado.proximoServicio,
      kilometrajeHoras:
        mantenimientoGuardado.kilometrajeHoras ===
        null
          ? null
          : Number(
              mantenimientoGuardado
                .kilometrajeHoras,
            ),
      costo:
        mantenimientoGuardado.costo === null
          ? null
          : Number(mantenimientoGuardado.costo),
      taller: mantenimientoGuardado.taller,
      estado: mantenimientoGuardado.estado,
      unidad: {
        id: unidad.id,
        codigo: unidad.codigo,
        tipo: unidad.tipo,
      },
    };
  }

  async obtenerTodos() {
    const mantenimientos =
      await this.maintenanceRepository.find({
        relations: {
          unidad: true,
        },
        order: {
          id: 'ASC',
        },
      });

    return mantenimientos.map(
      (mantenimiento) => ({
        id: mantenimiento.id,
        tipoMantenimiento:
          mantenimiento.tipoMantenimiento,
        observaciones:
          mantenimiento.observaciones,
        fechaMantenimiento:
          mantenimiento.fechaMantenimiento,
        proximoServicio:
          mantenimiento.proximoServicio,
        kilometrajeHoras:
          mantenimiento.kilometrajeHoras ===
          null
            ? null
            : Number(
                mantenimiento.kilometrajeHoras,
              ),
        costo:
          mantenimiento.costo === null
            ? null
            : Number(mantenimiento.costo),
        taller: mantenimiento.taller,
        estado: mantenimiento.estado,
        unidad: {
          id: mantenimiento.unidad.id,
          codigo: mantenimiento.unidad.codigo,
          tipo: mantenimiento.unidad.tipo,
        },
      }),
    );
  }
}