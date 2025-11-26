/**
 * Утилита для логирования
 * В продакшене логирует только ошибки, в dev режиме - все логи
 */

const isDev = __DEV__ || process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
};

