export interface Vencimientos {
  idUser: string;
  descripcion: string;
  responsable: string;
  email: string[];
  estado: false;
  fechaCreacion: Date;
  fechaCumplimiento: Date;
  fechaCumplimentado?: Date
}
