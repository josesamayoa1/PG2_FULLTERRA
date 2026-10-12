import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  Not,
  Repository,
} from 'typeorm';

import { Maintenance } from '../maintenance/entities/maintenance.entity';

@Injectable()
export class MaintenanceAlertsService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository:
      Repository<Maintenance>,
  ) {}

  private validarFecha(
    fecha: string,
  ) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
      throw new BadRequestException(
        'La fecha de referencia debe tener el formato YYYY-MM-DD',
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

    if (
      fechaValidada.getUTCFullYear() !==
        anio ||
      fechaValidada.getUTCMonth() !==
        mes - 1 ||
      fechaValidada.getUTCDate() !== dia
    ) {
      throw new BadRequestException(
        'La fecha de referencia no es válida',
      );
    }
  }

  private obtenerFechaActualGuatemala() {
    const partes =
      new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone:
            'America/Guatemala',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        },
      ).formatToParts(
        new Date(),
      );

    const anio =
      partes.find(
        (parte) =>
          parte.type === 'year',
      )?.value;

    const mes =
      partes.find(
        (parte) =>
          parte.type === 'month',
      )?.value;

    const dia =
      partes.find(
        (parte) =>
          parte.type === 'day',
      )?.value;

    return `${anio}-${mes}-${dia}`;
  }

  private calcularDiferenciaDias(
    fechaReferencia: string,
    fechaServicio: string,
  ) {
    const referencia =
      new Date(
        `${fechaReferencia}T00:00:00Z`,
      );

    const servicio =
      new Date(
        `${fechaServicio}T00:00:00Z`,
      );

    const diferencia =
      servicio.getTime() -
      referencia.getTime();

    return Math.round(
      diferencia /
        (
          1000 *
          60 *
          60 *
          24
        ),
    );
  }

  async obtenerAlertas(
    diasAnticipacion = 30,
    fechaReferencia?: string,
  ) {
    if (
      !Number.isInteger(
        diasAnticipacion,
      ) ||
      diasAnticipacion < 0 ||
      diasAnticipacion > 365
    ) {
      throw new BadRequestException(
        'Los días de anticipación deben ser un número entero entre 0 y 365',
      );
    }

    const fechaConsulta =
      fechaReferencia ??
      this.obtenerFechaActualGuatemala();

    this.validarFecha(
      fechaConsulta,
    );

    const mantenimientos =
      await this.maintenanceRepository.find({
        where: {
          proximoServicio:
            Not(IsNull()),
        },
        relations: {
          unidad: true,
        },
        order: {
          proximoServicio: 'ASC',
          id: 'ASC',
        },
      });

    const alertas =
      mantenimientos
        .map((mantenimiento) => {
          const proximoServicio =
            mantenimiento.proximoServicio;

          if (
            proximoServicio === null
          ) {
            return null;
          }

          const diasRestantes =
            this.calcularDiferenciaDias(
              fechaConsulta,
              proximoServicio,
            );

          if (
            diasRestantes >
            diasAnticipacion
          ) {
            return null;
          }

          let tipoAlerta:
            | 'VENCIDO'
            | 'HOY'
            | 'PROXIMO';

          if (diasRestantes < 0) {
            tipoAlerta = 'VENCIDO';
          } else if (
            diasRestantes === 0
          ) {
            tipoAlerta = 'HOY';
          } else {
            tipoAlerta = 'PROXIMO';
          }

          return {
            mantenimientoId:
              mantenimiento.id,

            tipoAlerta,

            diasRestantes,

            proximoServicio,

            tipoMantenimiento:
              mantenimiento
                .tipoMantenimiento,

            observaciones:
              mantenimiento.observaciones,

            unidad: {
              id:
                mantenimiento
                  .unidad.id,
              codigo:
                mantenimiento
                  .unidad.codigo,
              tipo:
                mantenimiento
                  .unidad.tipo,
              marca:
                mantenimiento
                  .unidad.marca,
              modelo:
                mantenimiento
                  .unidad.modelo,
            },
          };
        })
        .filter(
          (
            alerta,
          ): alerta is NonNullable<
            typeof alerta
          > => alerta !== null,
        );

    return {
      fechaReferencia:
        fechaConsulta,

      diasAnticipacion,

      totalAlertas:
        alertas.length,

      alertas,
    };
  }
}