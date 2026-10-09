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
  ) {
    const comparativo =
      await this.indicatorsService
        .obtenerComparativoMensual(
          anio,
          mes,
        );

    return {
      periodo:
        comparativo.periodoActual,

      resumen: {
        viajes:
          comparativo.resumen
            .actual.viajes,

        kilometros:
          comparativo.resumen
            .actual.kilometros,

        horasMaquinaria:
          comparativo.resumen
            .actual.horasUso,

        galonesCombustible:
          comparativo.resumen
            .actual.galones,

        mantenimientos:
          comparativo.resumen
            .actual.mantenimientos,
      },

      variacionMesAnterior: {
        viajes:
          comparativo.resumen
            .diferencia.viajes,

        kilometros:
          comparativo.resumen
            .diferencia.kilometros,

        horasMaquinaria:
          comparativo.resumen
            .diferencia.horasUso,

        galonesCombustible:
          comparativo.resumen
            .diferencia.galones,

        mantenimientos:
          comparativo.resumen
            .diferencia
            .mantenimientos,
      },

      unidades:
        comparativo
          .comparativosPorUnidad
          .map((registro) => ({
            unidad: registro.unidad,

            viajes:
              registro.actual.viajes,

            kilometros:
              registro.actual
                .kilometros,

            horasMaquinaria:
              registro.actual.horasUso,

            galonesCombustible:
              registro.actual.galones,

            mantenimientos:
              registro.actual
                .mantenimientos,
          })),
    };
  }
}