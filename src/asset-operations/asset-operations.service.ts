import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  Not,
  Repository,
} from 'typeorm';

import { AssetOperation } from './entities/asset-operation.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { CreateMachineryHoursDto } from './dto/create-machinery-hours.dto';
import { Unit } from '../units/entities/unit.entity';
import { Employee } from '../employees/entities/employee.entity';
import { ActivityType } from '../activity-types/entities/activity-type.entity';

@Injectable()
export class AssetOperationsService {
  constructor(
    @InjectRepository(AssetOperation)
    private readonly assetOperationRepository:
      Repository<AssetOperation>,

    @InjectRepository(Unit)
    private readonly unitRepository:
      Repository<Unit>,

    @InjectRepository(Employee)
    private readonly employeeRepository:
      Repository<Employee>,

    @InjectRepository(ActivityType)
    private readonly activityTypeRepository:
      Repository<ActivityType>,
  ) {}

  private validarIdPositivo(
    valor: number,
    nombreCampo: string,
  ) {
    if (
      !Number.isInteger(valor) ||
      valor <= 0
    ) {
      throw new BadRequestException(
        `${nombreCampo} debe ser un número entero mayor que cero`,
      );
    }
  }

  private validarFechaOperacion(
    fechaOperacion: string,
  ) {
    if (
      typeof fechaOperacion !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaOperacion)
    ) {
      throw new BadRequestException(
        'La fecha de operación debe tener el formato YYYY-MM-DD',
      );
    }

    const [anio, mes, dia] = fechaOperacion
      .split('-')
      .map(Number);

    const fecha = new Date(
      Date.UTC(anio, mes - 1, dia),
    );

    const fechaValida =
      fecha.getUTCFullYear() === anio &&
      fecha.getUTCMonth() === mes - 1 &&
      fecha.getUTCDate() === dia;

    if (!fechaValida) {
      throw new BadRequestException(
        'La fecha de operación no es válida',
      );
    }
  }

  async registrarViaje(
    createTripDto: CreateTripDto,
  ) {
    this.validarIdPositivo(
      createTripDto.unidadId,
      'unidadId',
    );

    this.validarIdPositivo(
      createTripDto.empleadoId,
      'empleadoId',
    );

    this.validarIdPositivo(
      createTripDto.tipoActividadId,
      'tipoActividadId',
    );

    this.validarFechaOperacion(
      createTripDto.fechaOperacion,
    );

    const unidad = await this.unitRepository.findOne({
      where: {
        id: createTripDto.unidadId,
      },
    });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad no encontrada',
      );
    }

    if (unidad.tipo !== 'CAMION') {
      throw new BadRequestException(
        'La unidad seleccionada debe ser un camión',
      );
    }

    if (!unidad.activo) {
      throw new BadRequestException(
        'La unidad seleccionada está inactiva',
      );
    }

    const empleado =
      await this.employeeRepository.findOne({
        where: {
          id: createTripDto.empleadoId,
        },
      });

    if (!empleado) {
      throw new NotFoundException(
        'Empleado no encontrado',
      );
    }

    if (!empleado.activo) {
      throw new BadRequestException(
        'El empleado seleccionado está inactivo',
      );
    }

    const tipoActividad =
      await this.activityTypeRepository.findOne({
        where: {
          id: createTripDto.tipoActividadId,
        },
      });

    if (!tipoActividad) {
      throw new NotFoundException(
        'Tipo de actividad no encontrado',
      );
    }

    if (tipoActividad.categoria !== 'CAMION') {
      throw new BadRequestException(
        'La actividad seleccionada debe corresponder a CAMION',
      );
    }

    if (!tipoActividad.activo) {
      throw new BadRequestException(
        'El tipo de actividad seleccionado está inactivo',
      );
    }

    if (
      !Number.isInteger(createTripDto.viajes) ||
      createTripDto.viajes <= 0
    ) {
      throw new BadRequestException(
        'La cantidad de viajes debe ser un número entero mayor que cero',
      );
    }

    const operacion =
      this.assetOperationRepository.create({
        unidad,
        empleado,
        tipoActividad,
        fechaOperacion:
          createTripDto.fechaOperacion,
        horasUso: null,
        viajes: createTripDto.viajes,
        observaciones:
          createTripDto.observaciones ?? null,
        estado: 'ACTIVO',
      });

    const operacionGuardada =
      await this.assetOperationRepository.save(
        operacion,
      );

    return {
      id: operacionGuardada.id,
      fechaOperacion:
        operacionGuardada.fechaOperacion,
      viajes: operacionGuardada.viajes,
      observaciones:
        operacionGuardada.observaciones,
      estado: operacionGuardada.estado,
      unidad: {
        id: unidad.id,
        codigo: unidad.codigo,
        tipo: unidad.tipo,
      },
      empleado: {
        id: empleado.id,
        nombres: empleado.nombres,
      },
      tipoActividad: {
        id: tipoActividad.id,
        nombre: tipoActividad.nombre,
        categoria: tipoActividad.categoria,
      },
    };
  }

  async obtenerViajes() {
    const operaciones =
      await this.assetOperationRepository.find({
        where: {
          viajes: Not(IsNull()),
        },
        relations: {
          unidad: true,
          empleado: true,
          tipoActividad: true,
        },
        order: {
          id: 'ASC',
        },
      });

    return operaciones.map((operacion) => ({
      id: operacion.id,
      fechaOperacion:
        operacion.fechaOperacion,
      viajes: operacion.viajes,
      observaciones:
        operacion.observaciones,
      estado: operacion.estado,
      unidad: {
        id: operacion.unidad.id,
        codigo: operacion.unidad.codigo,
        tipo: operacion.unidad.tipo,
      },
      empleado: {
        id: operacion.empleado.id,
        nombres: operacion.empleado.nombres,
      },
      tipoActividad: {
        id: operacion.tipoActividad.id,
        nombre: operacion.tipoActividad.nombre,
        categoria:
          operacion.tipoActividad.categoria,
      },
    }));
  }

  async registrarHorasMaquinaria(
    createMachineryHoursDto: CreateMachineryHoursDto,
  ) {
    this.validarIdPositivo(
      createMachineryHoursDto.unidadId,
      'unidadId',
    );

    this.validarIdPositivo(
      createMachineryHoursDto.empleadoId,
      'empleadoId',
    );

    this.validarIdPositivo(
      createMachineryHoursDto.tipoActividadId,
      'tipoActividadId',
    );

    this.validarFechaOperacion(
      createMachineryHoursDto.fechaOperacion,
    );

    const unidad = await this.unitRepository.findOne({
      where: {
        id: createMachineryHoursDto.unidadId,
      },
    });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad no encontrada',
      );
    }

    if (unidad.tipo !== 'MAQUINARIA') {
      throw new BadRequestException(
        'La unidad seleccionada debe ser maquinaria',
      );
    }

    if (!unidad.activo) {
      throw new BadRequestException(
        'La unidad seleccionada está inactiva',
      );
    }

    const empleado =
      await this.employeeRepository.findOne({
        where: {
          id: createMachineryHoursDto.empleadoId,
        },
      });

    if (!empleado) {
      throw new NotFoundException(
        'Empleado no encontrado',
      );
    }

    if (!empleado.activo) {
      throw new BadRequestException(
        'El empleado seleccionado está inactivo',
      );
    }

    const tipoActividad =
      await this.activityTypeRepository.findOne({
        where: {
          id:
            createMachineryHoursDto.tipoActividadId,
        },
      });

    if (!tipoActividad) {
      throw new NotFoundException(
        'Tipo de actividad no encontrado',
      );
    }

    if (
      tipoActividad.categoria !==
      'MAQUINARIA'
    ) {
      throw new BadRequestException(
        'La actividad seleccionada debe corresponder a MAQUINARIA',
      );
    }

    if (!tipoActividad.activo) {
      throw new BadRequestException(
        'El tipo de actividad seleccionado está inactivo',
      );
    }

    if (
      typeof createMachineryHoursDto.horasUso !==
        'number' ||
      !Number.isFinite(
        createMachineryHoursDto.horasUso,
      ) ||
      createMachineryHoursDto.horasUso <= 0
    ) {
      throw new BadRequestException(
        'Las horas de uso deben ser un número mayor que cero',
      );
    }

    const operacion =
      this.assetOperationRepository.create({
        unidad,
        empleado,
        tipoActividad,
        fechaOperacion:
          createMachineryHoursDto.fechaOperacion,
        horasUso:
          createMachineryHoursDto.horasUso,
        viajes: null,
        observaciones:
          createMachineryHoursDto.observaciones ??
          null,
        estado: 'ACTIVO',
      });

    const operacionGuardada =
      await this.assetOperationRepository.save(
        operacion,
      );

    return {
      id: operacionGuardada.id,
      fechaOperacion:
        operacionGuardada.fechaOperacion,
      horasUso: Number(
        operacionGuardada.horasUso,
      ),
      observaciones:
        operacionGuardada.observaciones,
      estado: operacionGuardada.estado,
      unidad: {
        id: unidad.id,
        codigo: unidad.codigo,
        tipo: unidad.tipo,
      },
      empleado: {
        id: empleado.id,
        nombres: empleado.nombres,
      },
      tipoActividad: {
        id: tipoActividad.id,
        nombre: tipoActividad.nombre,
        categoria: tipoActividad.categoria,
      },
    };
  }

  async obtenerHorasMaquinaria() {
    const operaciones =
      await this.assetOperationRepository.find({
        where: {
          horasUso: Not(IsNull()),
        },
        relations: {
          unidad: true,
          empleado: true,
          tipoActividad: true,
        },
        order: {
          id: 'ASC',
        },
      });

    return operaciones.map((operacion) => ({
      id: operacion.id,
      fechaOperacion:
        operacion.fechaOperacion,
      horasUso: Number(operacion.horasUso),
      observaciones:
        operacion.observaciones,
      estado: operacion.estado,
      unidad: {
        id: operacion.unidad.id,
        codigo: operacion.unidad.codigo,
        tipo: operacion.unidad.tipo,
      },
      empleado: {
        id: operacion.empleado.id,
        nombres: operacion.empleado.nombres,
      },
      tipoActividad: {
        id: operacion.tipoActividad.id,
        nombre: operacion.tipoActividad.nombre,
        categoria:
          operacion.tipoActividad.categoria,
      },
    }));
  }
}