import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActivityType } from './entities/activity-type.entity';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';

@Injectable()
export class ActivityTypesService {
  constructor(
    @InjectRepository(ActivityType)
    private readonly activityTypeRepository:
      Repository<ActivityType>,
  ) {}

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
    createActivityTypeDto: CreateActivityTypeDto,
  ) {
    const nombre =
      this.validarTextoObligatorio(
        createActivityTypeDto.nombre,
        'El nombre de la actividad',
      );

    const categoriaIngresada =
      this.validarTextoObligatorio(
        createActivityTypeDto.categoria,
        'La categoría',
      );

    const categoria =
      categoriaIngresada.toUpperCase();

    if (
      categoria !== 'CAMION' &&
      categoria !== 'MAQUINARIA'
    ) {
      throw new BadRequestException(
        'La categoría debe ser CAMION o MAQUINARIA',
      );
    }

    const actividadExistente =
      await this.activityTypeRepository.findOne({
        where: {
          nombre,
        },
      });

    if (actividadExistente) {
      throw new BadRequestException(
        'El tipo de actividad ya está registrado',
      );
    }

    let descripcion: string | undefined;

    if (
      createActivityTypeDto.descripcion !==
      undefined
    ) {
      descripcion =
        createActivityTypeDto.descripcion.trim();
    }

    const actividad =
      this.activityTypeRepository.create({
        nombre,
        descripcion,
        categoria,
      });

    const actividadGuardada =
      await this.activityTypeRepository.save(
        actividad,
      );

    return {
      id: actividadGuardada.id,
      nombre: actividadGuardada.nombre,
      descripcion:
        actividadGuardada.descripcion,
      categoria: actividadGuardada.categoria,
      activo: actividadGuardada.activo,
    };
  }

  async obtenerTodos() {
    return await this.activityTypeRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }
}