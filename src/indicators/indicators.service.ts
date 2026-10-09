import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Repository,
} from 'typeorm';

import { Unit } from '../units/entities/unit.entity';
import { AssetOperation } from '../asset-operations/entities/asset-operation.entity';
import { FuelLoad } from '../fuel/entities/fuel-load.entity';
import { Maintenance } from '../maintenance/entities/maintenance.entity';

@Injectable()
export class IndicatorsService {
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

  private validarPeriodo(
    anio: number,
    mes: number,
  ) {
    if (
      !Number.isInteger(anio) ||
      anio < 2000 ||
      anio > 2100
    ) {
      throw new BadRequestException(
        'El año debe ser un número entero entre 2000 y 2100',
      );
    }

    if (
      !Number.isInteger(mes) ||
      mes < 1 ||
      mes > 12
    ) {
      throw new BadRequestException(
        'El mes debe ser un número entero entre 1 y 12',
      );
    }
  }

  private obtenerRangoFechas(
    anio: number,
    mes: number,
  ) {
    const mesFormateado =
      String(mes).padStart(2, '0');

    const ultimoDia = new Date(
      Date.UTC(anio, mes, 0),
    ).getUTCDate();

    const fechaInicio =
      `${anio}-${mesFormateado}-01`;

    const fechaFin =
      `${anio}-${mesFormateado}-${String(
        ultimoDia,
      ).padStart(2, '0')}`;

    return {
      fechaInicio,
      fechaFin,
    };
  }

  async obtenerIndicadores(
    anio: number,
    mes: number,
  ) {
    this.validarPeriodo(
      anio,
      mes,
    );

    const {
      fechaInicio,
      fechaFin,
    } = this.obtenerRangoFechas(
      anio,
      mes,
    );

    const unidades =
      await this.unitRepository.find({
        order: {
          id: 'ASC',
        },
      });

    const operaciones =
      await this.assetOperationRepository.find({
        where: {
          fechaOperacion: Between(
            fechaInicio,
            fechaFin,
          ),
        },
        relations: {
          unidad: true,
        },
      });

    const cargasCombustible =
      await this.fuelLoadRepository.find({
        where: {
          fechaCarga: Between(
            fechaInicio,
            fechaFin,
          ),
        },
        relations: {
          unidad: true,
        },
      });

    const mantenimientos =
      await this.maintenanceRepository.find({
        where: {
          fechaMantenimiento: Between(
            fechaInicio,
            fechaFin,
          ),
        },
        relations: {
          unidad: true,
        },
      });

    const indicadoresPorUnidad =
      unidades.map((unidad) => {
        const operacionesUnidad =
          operaciones.filter(
            (operacion) =>
              operacion.unidad.id ===
              unidad.id,
          );

        const combustibleUnidad =
          cargasCombustible.filter(
            (carga) =>
              carga.unidad.id === unidad.id,
          );

        const mantenimientosUnidad =
          mantenimientos.filter(
            (mantenimiento) =>
              mantenimiento.unidad.id ===
              unidad.id,
          );

        const totalViajes =
          operacionesUnidad.reduce(
            (total, operacion) =>
              total +
              (operacion.viajes ?? 0),
            0,
          );

        const totalKilometros =
          operacionesUnidad.reduce(
            (total, operacion) =>
              total +
              (
                operacion.kilometros === null
                  ? 0
                  : Number(
                      operacion.kilometros,
                    )
              ),
            0,
          );

        const totalHoras =
          operacionesUnidad.reduce(
            (total, operacion) =>
              total +
              (
                operacion.horasUso === null
                  ? 0
                  : Number(
                      operacion.horasUso,
                    )
              ),
            0,
          );

        const totalGalones =
          combustibleUnidad.reduce(
            (total, carga) =>
              total +
              Number(carga.galones),
            0,
          );

        return {
          unidad: {
            id: unidad.id,
            codigo: unidad.codigo,
            tipo: unidad.tipo,
            marca: unidad.marca,
            modelo: unidad.modelo,
          },
          viajes: totalViajes,
          kilometros: totalKilometros,
          horasUso: totalHoras,
          galones: totalGalones,
          mantenimientos:
            mantenimientosUnidad.length,
        };
      });

    const resumen =
      indicadoresPorUnidad.reduce(
        (
          acumulado,
          indicador,
        ) => ({
          viajes:
            acumulado.viajes +
            indicador.viajes,

          kilometros:
            acumulado.kilometros +
            indicador.kilometros,

          horasUso:
            acumulado.horasUso +
            indicador.horasUso,

          galones:
            acumulado.galones +
            indicador.galones,

          mantenimientos:
            acumulado.mantenimientos +
            indicador.mantenimientos,
        }),
        {
          viajes: 0,
          kilometros: 0,
          horasUso: 0,
          galones: 0,
          mantenimientos: 0,
        },
      );

    return {
      periodo: {
        anio,
        mes,
        fechaInicio,
        fechaFin,
      },
      resumen,
      indicadoresPorUnidad,
    };
  }
}