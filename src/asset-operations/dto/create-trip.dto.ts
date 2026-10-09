export class CreateTripDto {
  unidadId: number;
  empleadoId: number;
  tipoActividadId: number;
  fechaOperacion: string;
  viajes: number;
  observaciones?: string;
}