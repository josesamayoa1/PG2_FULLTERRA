import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Unit } from './entities/unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
  ) {}

  private validarTipo(tipo: string) {
    const tipoNormalizado = tipo.toUpperCase();

    if (
      tipoNormalizado !== 'CAMION' &&
      tipoNormalizado !== 'MAQUINARIA'
    ) {
      throw new BadRequestException(
        'El tipo de unidad debe ser CAMION o MAQUINARIA',
      );
    }

    return tipoNormalizado;
  }

  async crear(createUnitDto: CreateUnitDto) {
    const tipo = this.validarTipo(
      createUnitDto.tipo,
    );

    const unidadPorCodigo =
      await this.unitRepository.findOne({
        where: {
          codigo: createUnitDto.codigo,
        },
      });

    if (unidadPorCodigo) {
      throw new BadRequestException(
        'El código de la unidad ya está registrado',
      );
    }

    const unidadPorPlacaOSerie =
      await this.unitRepository.findOne({
        where: {
          placaOSerie: createUnitDto.placaOSerie,
        },
      });

    if (unidadPorPlacaOSerie) {
      throw new BadRequestException(
        'La placa o serie de la unidad ya está registrada',
      );
    }

    const unidad = this.unitRepository.create({
      codigo: createUnitDto.codigo,
      tipo,
      marca: createUnitDto.marca,
      modelo: createUnitDto.modelo,
      placaOSerie: createUnitDto.placaOSerie,
      estado:
        createUnitDto.estado ?? 'DISPONIBLE',
    });

    const unidadGuardada =
      await this.unitRepository.save(unidad);

    return {
      id: unidadGuardada.id,
      codigo: unidadGuardada.codigo,
      tipo: unidadGuardada.tipo,
      marca: unidadGuardada.marca,
      modelo: unidadGuardada.modelo,
      placaOSerie: unidadGuardada.placaOSerie,
      estado: unidadGuardada.estado,
      activo: unidadGuardada.activo,
    };
  }

  async obtenerTodos() {
    const unidades = await this.unitRepository.find({
      order: {
        id: 'ASC',
      },
    });

    return unidades.map((unidad) => ({
      id: unidad.id,
      codigo: unidad.codigo,
      tipo: unidad.tipo,
      marca: unidad.marca,
      modelo: unidad.modelo,
      placaOSerie: unidad.placaOSerie,
      estado: unidad.estado,
      activo: unidad.activo,
    }));
  }

  async obtenerPorTipo(tipo: string) {
    const tipoNormalizado =
      this.validarTipo(tipo);

    const unidades = await this.unitRepository.find({
      where: {
        tipo: tipoNormalizado,
      },
      order: {
        id: 'ASC',
      },
    });

    return unidades.map((unidad) => ({
      id: unidad.id,
      codigo: unidad.codigo,
      tipo: unidad.tipo,
      marca: unidad.marca,
      modelo: unidad.modelo,
      placaOSerie: unidad.placaOSerie,
      estado: unidad.estado,
      activo: unidad.activo,
    }));
  }

  async actualizar(
    unidadId: number,
    updateUnitDto: UpdateUnitDto,
  ) {
    const unidad = await this.unitRepository.findOne({
      where: {
        id: unidadId,
      },
    });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad no encontrada',
      );
    }

    if (
      updateUnitDto.codigo !== undefined &&
      updateUnitDto.codigo !== unidad.codigo
    ) {
      const unidadPorCodigo =
        await this.unitRepository.findOne({
          where: {
            codigo: updateUnitDto.codigo,
          },
        });

      if (
        unidadPorCodigo &&
        unidadPorCodigo.id !== unidadId
      ) {
        throw new BadRequestException(
          'El código de la unidad ya está registrado',
        );
      }

      unidad.codigo = updateUnitDto.codigo;
    }

    if (
      updateUnitDto.placaOSerie !== undefined &&
      updateUnitDto.placaOSerie !==
        unidad.placaOSerie
    ) {
      const unidadPorPlacaOSerie =
        await this.unitRepository.findOne({
          where: {
            placaOSerie:
              updateUnitDto.placaOSerie,
          },
        });

      if (
        unidadPorPlacaOSerie &&
        unidadPorPlacaOSerie.id !== unidadId
      ) {
        throw new BadRequestException(
          'La placa o serie de la unidad ya está registrada',
        );
      }

      unidad.placaOSerie =
        updateUnitDto.placaOSerie;
    }

    if (updateUnitDto.marca !== undefined) {
      unidad.marca = updateUnitDto.marca;
    }

    if (updateUnitDto.modelo !== undefined) {
      unidad.modelo = updateUnitDto.modelo;
    }

    if (updateUnitDto.estado !== undefined) {
      unidad.estado = updateUnitDto.estado;
    }

    const unidadActualizada =
      await this.unitRepository.save(unidad);

    return {
      id: unidadActualizada.id,
      codigo: unidadActualizada.codigo,
      tipo: unidadActualizada.tipo,
      marca: unidadActualizada.marca,
      modelo: unidadActualizada.modelo,
      placaOSerie:
        unidadActualizada.placaOSerie,
      estado: unidadActualizada.estado,
      activo: unidadActualizada.activo,
    };
  }

  async cambiarEstadoActivo(
    unidadId: number,
    activo: boolean,
  ) {
    const unidad = await this.unitRepository.findOne({
      where: {
        id: unidadId,
      },
    });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad no encontrada',
      );
    }

    unidad.activo = activo;

    const unidadActualizada =
      await this.unitRepository.save(unidad);

    return {
      id: unidadActualizada.id,
      codigo: unidadActualizada.codigo,
      tipo: unidadActualizada.tipo,
      marca: unidadActualizada.marca,
      modelo: unidadActualizada.modelo,
      placaOSerie:
        unidadActualizada.placaOSerie,
      estado: unidadActualizada.estado,
      activo: unidadActualizada.activo,
    };
  }
}