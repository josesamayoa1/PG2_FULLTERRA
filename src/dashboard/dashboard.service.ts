import { Injectable } from '@nestjs/common';

import { IndicatorsService } from '../indicators/indicators.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly indicatorsService:
      IndicatorsService,
  ) {}

  async obtenerDashboard(
    anio: number,
    mes: number,
    dia?: number,
  ) {
    const indicadoresActuales =
      await this.indicatorsService
        .obtenerIndicadores(
          anio,
          mes,
          dia,
        );

    let anioAnterior = anio;
    let mesAnterior = mes - 1;

    if (mes === 1) {
      anioAnterior = anio - 1;
      mesAnterior = 12;
    }

    let diaAnterior:
      number | undefined;

    if (dia !== undefined) {
      const ultimoDiaMesAnterior =
        new Date(
          Date.UTC(
            anioAnterior,
            mesAnterior,
            0,
          ),
        ).getUTCDate();

      diaAnterior = Math.min(
        dia,
        ultimoDiaMesAnterior,
      );
    }

    const indicadoresAnteriores =
      await this.indicatorsService
        .obtenerIndicadores(
          anioAnterior,
          mesAnterior,
          diaAnterior,
        );

    return {
      periodo:
        indicadoresActuales.periodo,

      resumen: {
        viajes:
          indicadoresActuales
            .resumen.viajes,

        kilometros:
          indicadoresActuales
            .resumen.kilometros,

        horasMaquinaria:
          indicadoresActuales
            .resumen.horasUso,

        galonesCombustible:
          indicadoresActuales
            .resumen.galones,

        mantenimientos:
          indicadoresActuales
            .resumen.mantenimientos,
      },

      variacionMesAnterior: {
        viajes:
          indicadoresActuales
            .resumen.viajes -
          indicadoresAnteriores
            .resumen.viajes,

        kilometros:
          indicadoresActuales
            .resumen.kilometros -
          indicadoresAnteriores
            .resumen.kilometros,

        horasMaquinaria:
          indicadoresActuales
            .resumen.horasUso -
          indicadoresAnteriores
            .resumen.horasUso,

        galonesCombustible:
          indicadoresActuales
            .resumen.galones -
          indicadoresAnteriores
            .resumen.galones,

        mantenimientos:
          indicadoresActuales
            .resumen.mantenimientos -
          indicadoresAnteriores
            .resumen.mantenimientos,
      },

      unidades:
        indicadoresActuales
          .indicadoresPorUnidad
          .map((registro) => ({
            unidad: registro.unidad,

            viajes:
              registro.viajes,

            kilometros:
              registro.kilometros,

            horasMaquinaria:
              registro.horasUso,

            galonesCombustible:
              registro.galones,

            mantenimientos:
              registro.mantenimientos,
          })),
    };
  }
}