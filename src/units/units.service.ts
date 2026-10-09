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

  private validarTipo(tipo: string) {
    const tipoValidado =
      this.validarTextoObligatorio(
        tipo,
        'El tipo de unidad',
      );

    const tipoNormalizado =
      tipoValidado.toUpperCase();

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
    const codigo =
      this.validarTextoObligatorio(
        createUnitDto.codigo,
        'El código de la unidad',
      );

    const tipo = this.validarTipo(
      createUnitDto.tipo,
    );

    const marca =
      this.validarTextoObligatorio(
        createUnitDto.marca,
        'La marca de la unidad',
      );

    const modelo =
      this.validarTextoObligatorio(
        createUnitDto.modelo,
        'El modelo de la unidad',
      );

    const placaOSerie =
      this.validarTextoObligatorio(
        createUnitDto.placaOSerie,
        'La placa o serie de la unidad',
      );

    const unidadPorCodigo =
      await this.unitRepository.findOne({
        where: {
          codigo,
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
          placaOSerie,
        },
      });

    if (unidadPorPlacaOSerie) {
      throw new BadRequestException(
        'La placa o serie de la unidad ya está registrada',
      );
    }

    let estado = 'DISPONIBLE';

    if (createUnitDto.estado !== undefined) {
      estado =
        this.validarTextoObligatorio(
          createUnitDto.estado,
          'El estado de la unidad',
        );
    }

    const unidad = this.unitRepository.create({
      codigo,
      tipo,
      marca,
      modelo,
      placaOSerie,
      estado,
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
    const unidades =
      await this.unitRepository.find({
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

    const unidades =
      await this.unitRepository.find({
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
    const unidad =
      await this.unitRepository.findOne({
        where: {
          id: unidadId,
        },
      });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad no encontrada',
      );
    }

    if (updateUnitDto.codigo !== undefined) {
      const codigo =
        this.validarTextoObligatorio(
          updateUnitDto.codigo,
          'El código de la unidad',
        );

      if (codigo !== unidad.codigo) {
        const unidadPorCodigo =
          await this.unitRepository.findOne({
            where: {
              codigo,
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

        unidad.codigo = codigo;
      }
    }

    if (
      updateUnitDto.placaOSerie !== undefined
    ) {
      const placaOSerie =
        this.validarTextoObligatorio(
          updateUnitDto.placaOSerie,
          'La placa o serie de la unidad',
        );

      if (
        placaOSerie !== unidad.placaOSerie
      ) {
        const unidadPorPlacaOSerie =
          await this.unitRepository.findOne({
            where: {
              placaOSerie,
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

        unidad.placaOSerie = placaOSerie;
      }
    }

    if (updateUnitDto.marca !== undefined) {
      unidad.marca =
        this.validarTextoObligatorio(
          updateUnitDto.marca,
          'La marca de la unidad',
        );
    }

    if (updateUnitDto.modelo !== undefined) {
      unidad.modelo =
        this.validarTextoObligatorio(
          updateUnitDto.modelo,
          'El modelo de la unidad',
        );
    }

    if (updateUnitDto.estado !== undefined) {
      unidad.estado =
        this.validarTextoObligatorio(
          updateUnitDto.estado,
          'El estado de la unidad',
        );
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
    const unidad =
      await this.unitRepository.findOne({
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