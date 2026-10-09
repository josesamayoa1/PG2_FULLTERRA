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

  async crear(
    createActivityTypeDto: CreateActivityTypeDto,
  ) {
    const categoria =
      createActivityTypeDto.categoria.toUpperCase();

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
          nombre: createActivityTypeDto.nombre,
        },
      });

    if (actividadExistente) {
      throw new BadRequestException(
        'El tipo de actividad ya está registrado',
      );
    }

    const actividad =
      this.activityTypeRepository.create({
        nombre: createActivityTypeDto.nombre,
        descripcion:
          createActivityTypeDto.descripcion,
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