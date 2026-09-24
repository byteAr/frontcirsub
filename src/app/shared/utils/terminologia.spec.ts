import { comoAsociado } from './terminologia';

describe('comoAsociado', () => {

  it('cambia "socio" por "asociado" respetando mayúsculas', () => {
    expect(comoAsociado('SOCIO')).toBe('ASOCIADO');
    expect(comoAsociado('Socio')).toBe('Asociado');
    expect(comoAsociado('socio')).toBe('asociado');
  });

  it('respeta el femenino y el plural', () => {
    expect(comoAsociado('SOCIA')).toBe('ASOCIADA');
    expect(comoAsociado('Socios')).toBe('Asociados');
    expect(comoAsociado('socias')).toBe('asociadas');
  });

  it('cambia la palabra dentro de un texto más largo', () => {
    expect(comoAsociado('SOCIO ACTIVO')).toBe('ASOCIADO ACTIVO');
    expect(comoAsociado('Socio vitalicio')).toBe('Asociado vitalicio');
  });

  it('no toca palabras que sólo contienen esas letras', () => {
    expect(comoAsociado('Cuota social')).toBe('Cuota social');
    expect(comoAsociado('ASOCIADO')).toBe('ASOCIADO');
    expect(comoAsociado('Asociación')).toBe('Asociación');
    expect(comoAsociado('SOCIEDAD')).toBe('SOCIEDAD');
  });

  it('deja igual lo que no dice socio, y no rompe si no viene nada', () => {
    expect(comoAsociado('EMPLEADO')).toBe('EMPLEADO');
    expect(comoAsociado('')).toBe('');
    expect(comoAsociado(null)).toBe('');
    expect(comoAsociado(undefined)).toBe('');
  });
});
