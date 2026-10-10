import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MaintenanceAlertsService } from '../maintenance-alerts/maintenance-alerts.service';

@Injectable()
export class TelegramService {
  constructor(
    private readonly configService:
      ConfigService,

    private readonly maintenanceAlertsService:
      MaintenanceAlertsService,
  ) {}

  private obtenerConfiguracion() {
    const botToken =
      this.configService.get<string>(
        'TELEGRAM_BOT_TOKEN',
      );

    const chatId =
      this.configService.get<string>(
        'TELEGRAM_CHAT_ID',
      );

    if (
      !botToken ||
      !chatId
    ) {
      throw new BadRequestException(
        'La configuración de Telegram no está completa',
      );
    }

    return {
      botToken,
      chatId,
    };
  }

  private construirMensajeAlerta(
    alerta: {
      tipoAlerta:
        | 'VENCIDO'
        | 'HOY'
        | 'PROXIMO';
      diasRestantes: number;
      proximoServicio: string;
      tipoMantenimiento: string;
      unidad: {
        codigo: string;
        tipo: string;
        marca: string;
        modelo: string;
      };
    },
  ) {
    let situacion: string;

    if (
      alerta.tipoAlerta === 'VENCIDO'
    ) {
      situacion =
        `Vencido hace ${Math.abs(
          alerta.diasRestantes,
        )} día(s)`;
    } else if (
      alerta.tipoAlerta === 'HOY'
    ) {
      situacion =
        'El mantenimiento corresponde hoy';
    } else {
      situacion =
        `Faltan ${alerta.diasRestantes} día(s)`;
    }

    return [
      `Unidad: ${alerta.unidad.codigo}`,
      `Tipo: ${alerta.unidad.tipo}`,
      `Equipo: ${alerta.unidad.marca} ${alerta.unidad.modelo}`,
      `Servicio: ${alerta.tipoMantenimiento}`,
      `Próximo servicio: ${alerta.proximoServicio}`,
      `Estado: ${alerta.tipoAlerta}`,
      situacion,
    ].join('\n');
  }

  private async enviarMensaje(
    mensaje: string,
  ) {
    const {
      botToken,
      chatId,
    } = this.obtenerConfiguracion();

    const respuesta =
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: mensaje,
          }),
        },
      );

    if (!respuesta.ok) {
      throw new BadGatewayException(
        'No fue posible enviar la notificación mediante Telegram',
      );
    }

    return true;
  }

  async enviarAlertasMantenimiento(
    diasAnticipacion = 30,
    fechaReferencia?: string,
  ) {
    const resultadoAlertas =
      await this.maintenanceAlertsService
        .obtenerAlertas(
          diasAnticipacion,
          fechaReferencia,
        );

    if (
      resultadoAlertas.totalAlertas === 0
    ) {
      return {
        enviado: false,
        totalAlertas: 0,
        mensaje:
          'No existen alertas de mantenimiento para enviar',
      };
    }

    const detalleAlertas =
      resultadoAlertas.alertas
        .map(
          (alerta, indice) =>
            [
              `ALERTA ${indice + 1}`,
              this.construirMensajeAlerta(
                alerta,
              ),
            ].join('\n'),
        )
        .join('\n\n');

    const mensaje = [
      'FULLTERRA',
      'Alertas de mantenimiento preventivo',
      `Fecha de referencia: ${resultadoAlertas.fechaReferencia}`,
      `Total de alertas: ${resultadoAlertas.totalAlertas}`,
      '',
      detalleAlertas,
    ].join('\n');

    await this.enviarMensaje(
      mensaje,
    );

    return {
      enviado: true,
      fechaReferencia:
        resultadoAlertas.fechaReferencia,
      totalAlertas:
        resultadoAlertas.totalAlertas,
    };
  }
}