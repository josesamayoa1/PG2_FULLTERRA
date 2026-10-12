import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FuelLoad } from './entities/fuel-load.entity';
import { CreateFuelLoadDto } from './dto/create-fuel-load.dto';
import { Unit } from '../units/entities/unit.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FuelService {
  constructor(
    @InjectRepository(FuelLoad)
    private readonly fuelLoadRepository:
      Repository<FuelLoad>,

    @InjectRepository(Unit)
    private readonly unitRepository:
      Repository<Unit>,

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

  private validarFechaCarga(
    fechaCarga: string,
  ) {
    if (
      typeof fechaCarga !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaCarga)
    ) {
      throw new BadRequestException(
        'La fecha de carga debe tener el formato YYYY-MM-DD',
      );
    }

    const [anio, mes, dia] = fechaCarga
      .split('-')
      .map(Number);

    const fecha = new Date(
      Date.UTC(anio, mes - 1, dia),
    );

    const fechaValida =
      fecha.getUTCFullYear() === anio &&
      fecha.getUTCMonth() === mes - 1 &&
      fecha.getUTCDate() === dia;

    if (!fechaValida) {
      throw new BadRequestException(
        'La fecha de carga no es válida',
      );
    }
  }

  async registrarCarga(
    createFuelLoadDto: CreateFuelLoadDto,
    usuarioId: number,
  ) {
    this.validarIdPositivo(
      createFuelLoadDto.unidadId,
      'unidadId',
    );

    this.validarIdPositivo(
      usuarioId,
      'usuarioId',
    );

    this.validarFechaCarga(
      createFuelLoadDto.fechaCarga,
    );

    if (
      typeof createFuelLoadDto.galones !==
        'number' ||
      !Number.isFinite(
        createFuelLoadDto.galones,
      ) ||
      createFuelLoadDto.galones <= 0
    ) {
      throw new BadRequestException(
        'La cantidad de galones debe ser un número mayor que cero',
      );
    }

    const unidad = await this.unitRepository.findOne({
      where: {
        id: createFuelLoadDto.unidadId,
      },
    });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad no encontrada',
      );
    }

    if (!unidad.activo) {
      throw new BadRequestException(
        'La unidad seleccionada está inactiva',
      );
    }

    if (unidad.estado !== 'DISPONIBLE') {
      throw new BadRequestException(
        'La unidad seleccionada no está disponible',
      );
    }

    const usuario =
      await this.userRepository.findOne({
        where: {
          id: usuarioId,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const carga =
      this.fuelLoadRepository.create({
        unidad,
        usuario,
        fechaCarga:
          createFuelLoadDto.fechaCarga,
        galones:
          createFuelLoadDto.galones,
        observaciones:
          createFuelLoadDto.observaciones ??
          null,
        estado: 'ACTIVO',
      });

    const cargaGuardada =
      await this.fuelLoadRepository.save(
        carga,
      );

    return {
      id: cargaGuardada.id,
      fechaCarga:
        cargaGuardada.fechaCarga,
      galones: Number(
        cargaGuardada.galones,
      ),
      observaciones:
        cargaGuardada.observaciones,
      estado: cargaGuardada.estado,
      unidad: {
        id: unidad.id,
        codigo: unidad.codigo,
        tipo: unidad.tipo,
      },
      usuario: {
        id: usuario.id,
        usuario: usuario.usuario,
      },
    };
  }

  async obtenerCargas() {
    const cargas =
      await this.fuelLoadRepository.find({
        relations: {
          unidad: true,
          usuario: true,
        },
        order: {
          id: 'ASC',
        },
      });

    return cargas.map((carga) => ({
      id: carga.id,
      fechaCarga: carga.fechaCarga,
      galones: Number(carga.galones),
      observaciones:
        carga.observaciones,
      estado: carga.estado,
      unidad: {
        id: carga.unidad.id,
        codigo: carga.unidad.codigo,
        tipo: carga.unidad.tipo,
      },
      usuario: {
        id: carga.usuario.id,
        usuario: carga.usuario.usuario,
      },
    }));
  }
}