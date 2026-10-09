import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  Not,
  Repository,
} from 'typeorm';

import { Unit } from '../units/entities/unit.entity';
import { AssetOperation } from '../asset-operations/entities/asset-operation.entity';
import { FuelLoad } from '../fuel/entities/fuel-load.entity';
import { Maintenance } from '../maintenance/entities/maintenance.entity';

@Injectable()
export class UnitHistoryService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository:
      Repository<Unit>,

    @InjectRepository(AssetOperation)
    private readonly assetOperationRepository:
      Repository<AssetOperation>,

    @InjectRepository(FuelLoad)
    private readonly fuelLoadRepository:
      Repository<FuelLoad>,

    @InjectRepository(Maintenance)
    private readonly maintenanceRepository:
      Repository<Maintenance>,
  ) {}

  async obtenerHistorial(
    unidadId: number,
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

    const viajes =
      await this.assetOperationRepository.find({
        where: {
          unidad: {
            id: unidadId,
          },
          viajes: Not(IsNull()),
        },
        relations: {
          empleado: true,
          tipoActividad: true,
        },
        order: {
          fechaOperacion: 'DESC',
          id: 'DESC',
        },
      });

    const horasMaquinaria =
      await this.assetOperationRepository.find({
        where: {
          unidad: {
            id: unidadId,
          },
          horasUso: Not(IsNull()),
        },
        relations: {
          empleado: true,
          tipoActividad: true,
        },
        order: {
          fechaOperacion: 'DESC',
          id: 'DESC',
        },
      });

    const cargasCombustible =
      await this.fuelLoadRepository.find({
        where: {
          unidad: {
            id: unidadId,
          },
        },
        relations: {
          usuario: true,
        },
        order: {
          fechaCarga: 'DESC',
          id: 'DESC',
        },
      });

    const mantenimientos =
      await this.maintenanceRepository.find({
        where: {
          unidad: {
            id: unidadId,
          },
        },
        order: {
          fechaMantenimiento: 'DESC',
          id: 'DESC',
        },
      });

    return {
      unidad: {
        id: unidad.id,
        codigo: unidad.codigo,
        tipo: unidad.tipo,
        marca: unidad.marca,
        modelo: unidad.modelo,
        placaOSerie: unidad.placaOSerie,
        estado: unidad.estado,
        activo: unidad.activo,
      },

      viajes: viajes.map((viaje) => ({
        id: viaje.id,
        fechaOperacion:
          viaje.fechaOperacion,
        viajes: viaje.viajes,
        kilometros:
          viaje.kilometros === null
            ? null
            : Number(
                viaje.kilometros,
              ),
        observaciones:
          viaje.observaciones,
        estado: viaje.estado,
        empleado: {
          id: viaje.empleado.id,
          nombres: viaje.empleado.nombres,
        },
        actividad: {
          id: viaje.tipoActividad.id,
          nombre:
            viaje.tipoActividad.nombre,
        },
      })),

      horasMaquinaria:
        horasMaquinaria.map(
          (registro) => ({
            id: registro.id,
            fechaOperacion:
              registro.fechaOperacion,
            horasUso:
              registro.horasUso === null
                ? null
                : Number(
                    registro.horasUso,
                  ),
            observaciones:
              registro.observaciones,
            estado: registro.estado,
            empleado: {
              id: registro.empleado.id,
              nombres:
                registro.empleado.nombres,
            },
            actividad: {
              id: registro.tipoActividad.id,
              nombre:
                registro.tipoActividad
                  .nombre,
            },
          }),
        ),

      combustible:
        cargasCombustible.map(
          (carga) => ({
            id: carga.id,
            fechaCarga: carga.fechaCarga,
            galones: Number(carga.galones),
            observaciones:
              carga.observaciones,
            estado: carga.estado,
            usuario: {
              id: carga.usuario.id,
              usuario:
                carga.usuario.usuario,
            },
          }),
        ),

      mantenimientos:
        mantenimientos.map(
          (mantenimiento) => ({
            id: mantenimiento.id,
            tipoMantenimiento:
              mantenimiento
                .tipoMantenimiento,
            observaciones:
              mantenimiento.observaciones,
            fechaMantenimiento:
              mantenimiento
                .fechaMantenimiento,
            proximoServicio:
              mantenimiento
                .proximoServicio,
            kilometrajeHoras:
              mantenimiento
                .kilometrajeHoras === null
                ? null
                : Number(
                    mantenimiento
                      .kilometrajeHoras,
                  ),
            costo:
              mantenimiento.costo === null
                ? null
                : Number(
                    mantenimiento.costo,
                  ),
            taller:
              mantenimiento.taller,
            estado:
              mantenimiento.estado,
          }),
        ),
    };
  }
}