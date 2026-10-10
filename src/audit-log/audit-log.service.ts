import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository:
      Repository<AuditLog>,
  ) {}

  async registrar(
    usuarioId: number,
    accion: string,
    modulo: string,
    registroId?: number,
    detalle?: string,
  ) {
    const registro =
      this.auditLogRepository.create({
        usuario: {
          id: usuarioId,
        } as User,
        accion,
        modulo,
        registroId:
          registroId ?? null,
        detalle:
          detalle ?? null,
      });

    return this.auditLogRepository.save(
      registro,
    );
  }

  async obtenerBitacora() {
    const registros =
      await this.auditLogRepository.find({
        relations: {
          usuario: true,
        },
        order: {
          fechaAccion: 'DESC',
          id: 'DESC',
        },
      });

    return registros.map(
      (registro) => ({
        id: registro.id,

        accion:
          registro.accion,

        modulo:
          registro.modulo,

        registroId:
          registro.registroId,

        detalle:
          registro.detalle,

        fechaAccion:
          registro.fechaAccion,

        usuario: {
          id:
            registro.usuario.id,

          usuario:
            registro.usuario.usuario,

          activo:
            registro.usuario.activo,
        },
      }),
    );
  }
}