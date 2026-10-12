import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { AuditLogService } from './audit-log.service';

type AuthenticatedRequest =
  Request & {
    user?: {
      id: number;
      usuario: string;
      roles: string[];
    };
  };

@Injectable()
export class AuditLogInterceptor
  implements NestInterceptor
{
  constructor(
    private readonly auditLogService:
      AuditLogService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const metodosAuditables = [
      'POST',
      'PATCH',
      'DELETE',
    ];

    if (
      !metodosAuditables.includes(
        request.method,
      ) ||
      !request.user?.id
    ) {
      return next.handle();
    }

    const usuarioId =
      request.user.id;

    return next.handle().pipe(
      mergeMap(
        async (respuesta: unknown) => {
          const ruta =
            request.originalUrl
              .split('?')[0];

          const segmentos =
            ruta
              .split('/')
              .filter(Boolean);

          const modulo =
            segmentos[0] ??
            'desconocido';

          let accion: string;

          if (
            modulo === 'telegram'
          ) {
            accion = 'EJECUTAR';
          } else if (
            request.method === 'POST'
          ) {
            accion = 'CREAR';
          } else if (
            request.method === 'PATCH'
          ) {
            accion = 'MODIFICAR';
          } else {
            accion = 'ELIMINAR';
          }

          let registroId:
            | number
            | undefined;

          if (
            typeof respuesta ===
              'object' &&
            respuesta !== null &&
            'id' in respuesta
          ) {
            const idRespuesta =
              (
                respuesta as {
                  id?: unknown;
                }
              ).id;

            if (
              typeof idRespuesta ===
                'number' &&
              Number.isInteger(
                idRespuesta,
              )
            ) {
              registroId =
                idRespuesta;
            }
          }

          if (
            registroId === undefined &&
            request.params?.id
          ) {
            const idParametro =
              Number(
                request.params.id,
              );

            if (
              Number.isInteger(
                idParametro,
              ) &&
              idParametro > 0
            ) {
              registroId =
                idParametro;
            }
          }

          await this.auditLogService
            .registrar(
              usuarioId,
              accion,
              modulo,
              registroId,
              `${request.method} ${ruta}`,
            );

          return respuesta;
        },
      ),
    );
  }
}