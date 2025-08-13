export interface User {
  ok:       boolean;
  token:    string;
  user:     UserClass;
  userData: UserData;
}

export interface UserClass {
  Id:                number;
  Personas_Id:       number;
  Pass_Hash:         string;
  Activo:            boolean;
  VALIDADO_:         boolean;
  Bloqueado:         boolean;
  Intentos_Fallidos: number;
  Fecha_Creacion:    Date;
  login_email:       string;
  celular:           string;
}

export interface UserData {
  Persona:     Persona[];
  Socio:       Socio[];
  Personal:    Personal[];
  GpoFamiliar: GpoFamiliar[];
  Beneficios:  Beneficio[];
  Reintegros:  Reintegro[];
}

export interface Beneficio {
  Personas_id:   number;
  Evacuacion:    number;
  SeguroSepelio: number;
  SeguroVida:    number;
}

export interface GpoFamiliar {
  socioId:                  number;
  Documento:                string;
  Nombre:                   string;
  tipo_parentesco_Id?:      number;
  Discapacitado:            string;
  Tipo_Parentesco_Detalle?: string;
  Socio_Id_Titular:         number;
  Consultado:               number;
}

export interface Persona {
  Id:        number;
  Documento: string;
  Apellido:  string;
  Nombre:    string;
}

export interface Personal {
  Id:                 number;
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
  Id: number;
}
