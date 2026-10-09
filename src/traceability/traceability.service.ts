import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AssetOperation } from '../asset-operations/entities/asset-operation.entity';

@Injectable()
export class TraceabilityService {
  constructor(
    @InjectRepository(AssetOperation)
    private readonly assetOperationRepository:
      Repository<AssetOperation>,
  ) {}

  async obtenerTrazabilidad() {
    const operaciones =
      await this.assetOperationRepository.find({
        relations: {
          unidad: true,
          empleado: true,
          tipoActividad: true,
        },
        order: {
          fechaOperacion: 'DESC',
          id: 'DESC',
        },
      });

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

      horasUso:
        operacion.horasUso === null
          ? null
          : Number(operacion.horasUso),

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