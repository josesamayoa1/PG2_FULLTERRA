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
    private readonly configService: ConfigService,
    private readonly maintenanceAlertsService: MaintenanceAlertsService,
  ) {}

  private obtenerConfiguracion() {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!botToken || !chatId) {
      throw new BadRequestException(
        'La configuración de Telegram no está completa',
      );
    }

    return { botToken, chatId };
  }

  private formatearFecha(fecha: string): string {
    const partes = fecha.slice(0, 10).split('-');
    if (partes.length === 3 && partes[0].length === 4) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fecha;
  }

  private construirMensajeAlerta(alerta: {
    tipoAlerta: 'VENCIDO' | 'HOY' | 'PROXIMO';
    diasRestantes: number;
    proximoServicio: string;
    tipoMantenimiento: string;
    unidad: {
      codigo: string;
      tipo: string;
      marca: string;
      modelo: string;
    };
  }): string {
    const esMaquinaria = /maquinaria|máquina|maquina/i.test(alerta.unidad.tipo);
    const iconoUnidad = esMaquinaria ? '🚜' : '🚛';
    let encabezado: string;
    let indicacion: string;

    if (alerta.tipoAlerta === 'VENCIDO') {
      encabezado = '🔴 MANTENIMIENTO VENCIDO';
      indicacion = `⚠️ Este servicio lleva ${Math.abs(alerta.diasRestantes)} día(s) vencido.`;
    } else if (alerta.tipoAlerta === 'HOY') {
      encabezado = '🚨 MANTENIMIENTO PARA HOY';
      indicacion = '⚠️ Este servicio debe realizarse hoy.';
    } else {
      encabezado = '🔔 PRÓXIMO MANTENIMIENTO';
      indicacion = `⏳ Faltan ${alerta.diasRestantes} día(s) para realizarlo.`;
    }

    return [
      encabezado,
      `${iconoUnidad} Unidad: ${alerta.unidad.codigo}`,
      `🔧 Servicio: ${alerta.tipoMantenimiento}`,
      `📅 Fecha: ${this.formatearFecha(alerta.proximoServicio)}`,
      indicacion,
    ].join('\n');
  }

  private async enviarMensaje(mensaje: string) {
    const { botToken, chatId } = this.obtenerConfiguracion();
    const respuesta = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: mensaje }),
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
    const resultadoAlertas = await this.maintenanceAlertsService.obtenerAlertas(
      diasAnticipacion,
      fechaReferencia,
    );

    if (resultadoAlertas.totalAlertas === 0) {
      return {
        enviado: false,
        totalAlertas: 0,
        mensaje: 'No existen alertas de mantenimiento para enviar',
      };
    }

    const ordenPrioridad = { VENCIDO: 0, HOY: 1, PROXIMO: 2 };
    const alertasOrdenadas = [...resultadoAlertas.alertas].sort(
      (a, b) => ordenPrioridad[a.tipoAlerta] - ordenPrioridad[b.tipoAlerta],
    );

    const detalleAlertas = alertasOrdenadas
      .map((alerta) => this.construirMensajeAlerta(alerta))
      .join('\n\n━━━━━━━━━━━━━━━━━━\n\n');

    const mensaje = [
      '🚧 FULLTERRA | MANTENIMIENTOS',
      '',
      detalleAlertas,
      '',
      '━━━━━━━━━━━━━━━━━━',
      '🤖 Sistema FULLTERRA',
    ].join('\n');

    await this.enviarMensaje(mensaje);

    return {
      enviado: true,
      fechaReferencia: resultadoAlertas.fechaReferencia,
      totalAlertas: resultadoAlertas.totalAlertas,
    };
  }
}
