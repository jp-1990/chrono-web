const SEVERITY = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
} as const;

type LogSeverity = (typeof SEVERITY)[keyof typeof SEVERITY];

type LogError = {
  code?: string | number;
  message: string;
  stacktrace: string;
};

type LogData = Record<
  string,
  string | number | string[] | number[] | (string | number)[]
>;

type Log = {
  userId: string;
  timestamp: number;
  severity: LogSeverity;
  env: string;
  url: string;
  screen: string;
  viewport: string;
  error?: LogError;
  data?: LogData;
};

class Logging {
  constructor() {}

  #internal_sanitizeObject<T extends LogError | LogData>(obj: T): T {
    const output = {} as T;
    for (const key of Object.keys(obj)) {
      switch (typeof obj[key]) {
        case 'string':
          if (/user|pass/g.test(key)) {
            output[key] = 'REDACTED';
          } else {
            output[key] = obj[key];
          }

          break;
        default:
          output[key] = obj[key];
          break;
      }
    }

    return output;
  }

  #internal_buildLog(
    severity: LogSeverity,
    error?: LogError,
    data?: LogData
  ): Log {
    const user = useUserState();

    const sanitizedError = error && this.#internal_sanitizeObject(error);
    const sanitizedData = data && this.#internal_sanitizeObject(data);

    const log: Log = {
      severity,
      userId: user.value.id,
      timestamp: Date.now(),
      env: process.env.NODE_ENV ?? 'unknown',
      url: window.location.href,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    if (sanitizedError) log.error = sanitizedError;
    if (sanitizedData) log.data = sanitizedData;

    return log;
  }

  info(error?: LogError, data?: LogData) {
    const log = this.#internal_buildLog(SEVERITY.INFO, error, data);
    console.log(log);
  }

  warn(error?: LogError, data?: LogData) {
    const log = this.#internal_buildLog(SEVERITY.INFO, error, data);
    console.warn(log);
  }

  error(error: LogError, data?: LogData) {
    const log = this.#internal_buildLog(SEVERITY.INFO, error, data);
    console.error(log);
  }

  critical(error: LogError, data: LogData) {
    const log = this.#internal_buildLog(SEVERITY.INFO, error, data);
    console.error(log);
  }
}

export const logging = new Logging();
