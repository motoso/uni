export interface ScraperLogger {
  debug(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export function createScraperLogger(scope: string): ScraperLogger {
  const isCI = !!(typeof process !== "undefined" && process.env?.CI);
  const prefix = `[${scope}]`;

  return {
    debug(message, ...args) {
      if (isCI) {
        console.log(`${prefix} ${message}`, ...args);
      }
    },
    error(message, ...args) {
      console.error(`${prefix} ${message}`, ...args);
    },
  };
}
