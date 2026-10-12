export class CreateMaintenanceDto {
  unidadId: number;
  tipoMantenimiento: string;
  observaciones?: string;
  fechaMantenimiento: string;
  proximoServicio?: string;
  kilometrajeHoras?: number;
  costo?: number;
  taller?: string;
}