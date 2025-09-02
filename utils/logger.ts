// utils/logger.ts
// Safe logging utility for production builds

const isDevelopment = __DEV__;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  }
};

// For quick replacement of existing console.log statements
export const debugLog = logger.log;
