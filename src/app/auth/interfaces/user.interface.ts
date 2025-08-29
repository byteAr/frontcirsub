export interface User {
  ok:       boolean;
  token:    string;
  userData: UserData;
}

export interface UserData {
  Persona:     Persona[];
  Socio?:       Socio[];
  Personal?:    Personal[];
  GpoFamiliar?: any[];
  Beneficios?:  Beneficio[];
  Reintegros?:  Reintegro[];
}

export interface Beneficio {
  Id:                         number;
  Personas_Id:                number;
  Afi_Tipo_Beneficio_Id:      number;
  afi_Tipo_Beneficio_Detalle: string;
}

export interface Persona {
  Id:                         number;
  Documento:                  string;
  Apellido:                   string;
  Nombre:                     string;
  Fecha_Nacimiento:           Date;
  Sexo:                       string;
  Validado:                   boolean;
  Socios_Personas_Id_Titular: number;
  Discapacitado:              boolean;
  Encuesta:                   boolean;
  Usuario_Registrado:         boolean;
  Usuario_Bloqueado:          boolean;
}

export interface Personal {
  Id:                 number;
  Legajo:             null;
  Tipo_Area:          number;
  Tipo_Cargo:         number;
  Filial_Id:          number;
  Filial_Detalle:     string;
  Tipo_Cargo_Detalle: string;
  es_Encargado_Area:  boolean;
}

export interface Reintegro {
  Id:                   number;
  Personas_id:          number;
  OrdenPago:            number;
  FechaCargaReceta:     Date;
  DescripcionReintegro: string;
  Op_estado:            string;
  Op_importe:           number;
  Fechapago:            Date;
}

export interface Socio {
  Id:                         number;
  Socios_Personas_Id_Titular: number;
  Personas_Id:                number;
  Tipo_Socio:                 null;
  Fecha_Alta:                 Date;
  EsTitular:                  number;
}
