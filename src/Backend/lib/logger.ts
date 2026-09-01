type LogMetadata = {
  requestId?: string;
  route?: string;
  userId?: string | null;
  [key: string]: unknown;
};

type LogLevel = "info" | "warn" | "error";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: error,
  };
}

function writeLog(level: LogLevel, message: string, metadata: LogMetadata = {}, error?: unknown) {
  const { requestId = null, route = null, userId = null, ...extraMetadata } = metadata;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId,
    route,
    userId,
    ...(Object.keys(extraMetadata).length > 0 ? { metadata: extraMetadata } : {}),
    ...(error !== undefined ? { error: serializeError(error) } : {}),
  };

  const writer =
    level === "error" ? console.error : level === "warn" ? console.warn : console.info;

  writer(JSON.stringify(entry));
}

export const log = {
  info(message: string, metadata?: LogMetadata) {
    writeLog("info", message, metadata);
  },
  warn(message: string, metadata?: LogMetadata) {
    writeLog("warn", message, metadata);
  },
  error(message: string, error: unknown, metadata?: LogMetadata) {
    writeLog("error", message, metadata, error);
  },
};

export type { LogMetadata };
