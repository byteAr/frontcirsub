import { enlaceAdhesion, enlaceWhatsapp, NOMBRE_BENEFICIO } from './beneficios';

describe('constantes de beneficios', () => {

  it('arma el enlace de adhesión al número de adhesiones, nombrando el beneficio', () => {
    const enlace = enlaceAdhesion('eva');

    expect(enlace.startsWith('https://wa.me/5491126526532?text=')).toBeTrue();
    expect(decodeURIComponent(enlace)).toContain('Hola, quiero adherirme al beneficio de Evacuaciones.');
  });

  it('codifica el mensaje para que no rompa la URL', () => {
    const enlace = enlaceWhatsapp('5491100000000', 'Hola & chau? sí');

    expect(enlace).toBe('https://wa.me/5491100000000?text=Hola%20%26%20chau%3F%20s%C3%AD');
  });

  it('tiene nombre para los cuatro beneficios que trae el perfil', () => {
    expect(Object.keys(NOMBRE_BENEFICIO).sort()).toEqual(['eva', 'far', 'seg', 'sep']);
  });
});
