import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AssetOperation } from '../asset-operations/entities/asset-operation.entity';

type TraceabilityFilters = {
  unidadId?: number;
  empleadoId?: number;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

@Injectable()
export class TraceabilityService {
  constructor(
    @InjectRepository(AssetOperation)
    private readonly assetOperationRepository:
      Repository<AssetOperation>,
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

    const [anio, mes, dia] =
      fecha
        .split('-')
        .map(Number);

    const fechaValidada =
      new Date(
        Date.UTC(
          anio,
          mes - 1,
          dia,
        ),
      );

    const esValida =
      fechaValidada.getUTCFullYear() ===
        anio &&
      fechaValidada.getUTCMonth() ===
        mes - 1 &&
      fechaValidada.getUTCDate() === dia;

    if (!esValida) {
      throw new BadRequestException(
        `${nombreCampo} no es válida`,
      );
    }
  }

  async obtenerTrazabilidad(
    filtros: TraceabilityFilters = {},
  ) {
    const {
      unidadId,
      empleadoId,
      fecha,
      fechaInicio,
      fechaFin,
    } = filtros;

    if (unidadId !== undefined) {
      this.validarIdPositivo(
        unidadId,
        'unidadId',
      );
    }

    if (empleadoId !== undefined) {
      this.validarIdPositivo(
        empleadoId,
        'empleadoId',
      );
    }

    if (
      fecha !== undefined &&
      (
        fechaInicio !== undefined ||
        fechaFin !== undefined
      )
    ) {
      throw new BadRequestException(
        'No se puede combinar fecha con fechaInicio o fechaFin',
      );
    }

    if (
      (
        fechaInicio !== undefined &&
        fechaFin === undefined
      ) ||
      (
        fechaInicio === undefined &&
        fechaFin !== undefined
      )
    ) {
      throw new BadRequestException(
        'Para consultar por período se requieren fechaInicio y fechaFin',
      );
    }

    if (fecha !== undefined) {
      this.validarFecha(
        fecha,
        'fecha',
      );
    }

    if (
      fechaInicio !== undefined &&
      fechaFin !== undefined
    ) {
      this.validarFecha(
        fechaInicio,
        'fechaInicio',
      );

      this.validarFecha(
        fechaFin,
        'fechaFin',
      );

      if (fechaInicio > fechaFin) {
        throw new BadRequestException(
          'fechaInicio no puede ser posterior a fechaFin',
        );
      }
    }

    const consulta =
      this.assetOperationRepository
        .createQueryBuilder('operacion')
        .leftJoinAndSelect(
          'operacion.unidad',
          'unidad',
        )
        .leftJoinAndSelect(
          'operacion.empleado',
          'empleado',
        )
        .leftJoinAndSelect(
          'operacion.tipoActividad',
          'tipoActividad',
        );

    if (unidadId !== undefined) {
      consulta.andWhere(
        'unidad.id = :unidadId',
        {
          unidadId,
        },
      );
    }

    if (empleadoId !== undefined) {
      consulta.andWhere(
        'empleado.id = :empleadoId',
        {
          empleadoId,
        },
      );
    }

    if (fecha !== undefined) {
      consulta.andWhere(
        'operacion.fechaOperacion = :fecha',
        {
          fecha,
        },
      );
    }

    if (
      fechaInicio !== undefined &&
      fechaFin !== undefined
    ) {
      consulta.andWhere(
        'operacion.fechaOperacion BETWEEN :fechaInicio AND :fechaFin',
        {
          fechaInicio,
          fechaFin,
        },
      );
    }

    const operaciones =
      await consulta
        .orderBy(
          'operacion.fechaOperacion',
          'DESC',
        )
        .addOrderBy(
          'operacion.id',
          'DESC',
        )
        .getMany();

    return operaciones.map((operacion) => ({
      id: operacion.id,

      tipoOperacion:
        operacion.viajes !== null
          ? 'VIAJE'
          : 'HORAS_MAQUINARIA',

      fechaOperacion:
        operacion.fechaOperacion,

      viajes:
        operacion.viajes,

      kilometros:
        operacion.kilometros === null
          ? null
          : Number(
              operacion.kilometros,
            ),

      horasUso:
        operacion.horasUso === null
          ? null
          : Number(
              operacion.horasUso,
            ),

      observaciones:
        operacion.observaciones,

      estado:
        operacion.estado,

      unidad: {
        id: operacion.unidad.id,
        codigo: operacion.unidad.codigo,
        tipo: operacion.unidad.tipo,
        marca: operacion.unidad.marca,
        modelo: operacion.unidad.modelo,
      },

      empleado: {
        id: operacion.empleado.id,
        nombres:
          operacion.empleado.nombres,
        puesto:
          operacion.empleado.puesto,
      },

      actividad: {
        id: operacion.tipoActividad.id,
        nombre:
          operacion.tipoActividad.nombre,
        categoria:
          operacion.tipoActividad.categoria,
      },
    }));
  }
}