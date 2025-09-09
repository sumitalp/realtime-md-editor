import { createLogger, format, transports, Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// Extract caller info from stack trace
function getCallerInfo() {
  const obj: { file?: string; line?: string; method?: string } = {};
  const stack = new Error().stack?.split("\n");

  if (stack && stack.length >= 4) {
    // stack[0] = Error
    // stack[1] = at getCallerInfo
    // stack[2] = at wrapper function
    // stack[3] = actual caller
    const callerLine = stack[3].trim();

    const match =
      callerLine.match(/at (.+?) \((.+):(\d+):(\d+)\)/) ||
      callerLine.match(/at (.+):(\d+):(\d+)/);

    if (match) {
      if (match.length === 5) {
        obj.method = match[1];
        obj.file = path.basename(match[2]);
        obj.line = match[3];
      } else if (match.length === 4) {
        obj.file = path.basename(match[1]);
        obj.line = match[2];
      }
    }
  }
  return obj;
}

const logDir = "logs";

const logger: Logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      dirname: logDir,
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

// Wrapper that injects caller info BEFORE Winston transforms
export const log = {
  info: (msg: string, meta: object = {}) => {
    logger.info({ message: msg, ...meta, ...getCallerInfo() });
  },
  error: (msg: string, meta: object = {}) => {
    logger.error({ message: msg, ...meta, ...getCallerInfo() });
  },
  warn: (msg: string, meta: object = {}) => {
    logger.warn({ message: msg, ...meta, ...getCallerInfo() });
  },
  debug: (msg: string, meta: object = {}) => {
    logger.debug({ message: msg, ...meta, ...getCallerInfo() });
  },
};

export default logger;