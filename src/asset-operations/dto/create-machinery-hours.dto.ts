export class CreateMachineryHoursDto {
  unidadId: number;
  empleadoId: number;
  tipoActividadId: number;
  fechaOperacion: string;
  horasUso: number;
  observaciones?: string;
}