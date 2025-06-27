export interface User {
  Persona:     Persona[];
  Socio:       Socio[];
  Personal:    Personal[];
  GpoFamiliar: GpoFamiliar[];
  Beneficios:  any[];
}

export interface GpoFamiliar {
  socioId:                  number;
  Documento:                string;
  Nombre:                   string;
  Tipo_Socio?:              string;
  Fecha_Alta:               Date;
  Discapacitado:            string;
  Socio_Id_Titular:         number;
  socio?:                   string;
  Consultado:               number;
  tipo_parentesco_Id?:      number;
  Tipo_Parentesco_Detalle?: string;
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

export interface Socio {
  Id:         number;
  Fecha_Alta: Date;
  TipoSocio:  string;
}
