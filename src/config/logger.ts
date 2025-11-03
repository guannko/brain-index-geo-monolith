import pino from 'pino';
import config from './env.config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: config.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        }
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

export default logger;
