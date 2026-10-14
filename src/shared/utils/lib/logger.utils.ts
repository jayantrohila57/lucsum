import { clientEnv } from "@/shared/config/env.client";
import { getTimestamp } from "./date-time.utils";

type LogType = "log" | "warn" | "error";

const getColor = (type: LogType): string => {
  const isNode = typeof window === "undefined";
  if (isNode) {
    return type === "log" ? "\x1b[32m" : type === "warn" ? "\x1b[36m" : "\x1b[31m";
  } else {
    return type === "log" ? "color: green" : type === "warn" ? "color: cyan" : "color: red";
  }
};

const printDebug = (type: LogType, tag: string, ...props: unknown[]) => {
  const timestamp = getTimestamp();
  const isNode = typeof window === "undefined";
  const environment = clientEnv.NODE_ENV || "development";

  if (isNode) {
    const typeColor = getColor(type);
    const timestampColor = "\x1b[36m"; // Cyan
    const fileColor = "\x1b[32m"; // Green
    const envColor = "\x1b[36m"; // Cyan

    const typeSection = `[${typeColor}${type.toUpperCase()}\x1b[0m]`;
    const timestampSection = `[${timestampColor}${timestamp}\x1b[0m]`;
    const fileSection = `[${fileColor}${tag.toUpperCase()}\x1b[0m]`;
    const envSection = `[${envColor}${environment.toUpperCase()}\x1b[0m]`;

    const label = `${envSection}-${typeSection}-${timestampSection}-${fileSection}`;
    console[type](label, ...props);
  } else {
    const typeColor = getColor(type);
    const timestampColor = "color: cyan";
    const fileColor = "color: green";
    const envColor = "color: cyan";

    const typeSection = `[%c${type.toUpperCase()}%c]`;
    const timestampSection = `[%c${timestamp}%c]`;
    const fileSection = `[%c${tag.toUpperCase()}%c]`;
    const envSection = `[%c${environment.toUpperCase()}%c]`;

    const label = `${envSection}-${typeSection}-${timestampSection}-${fileSection}`;
    console[type](label, envColor, "", typeColor, "", timestampColor, "", fileColor, "", ...props);
  }
};

const debugLog = (file: string, ...props: unknown[]) => printDebug("log", file, ...props);
const debugWarn = (file: string, ...props: unknown[]) => printDebug("warn", file, ...props);
const debugError = (file: string, ...props: unknown[]) => printDebug("error", file, ...props);

export { debugError, debugLog, debugWarn };
