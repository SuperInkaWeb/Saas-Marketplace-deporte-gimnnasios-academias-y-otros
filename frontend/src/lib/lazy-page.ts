import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'hercix-lazy-reload';

/**
 * React.lazy con un reintento: si se publicó una versión nueva mientras el usuario tenía la
 * página abierta, el archivo de la página vieja ya no existe y la carga falla. En ese caso se
 * recarga la página una sola vez para traer la versión nueva (AUD-36).
 */
export function lazyPage<T extends ComponentType<object>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await load();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return new Promise<{ default: T }>(() => {}); // la página se está recargando
      }
      throw err;
    }
  });
}
