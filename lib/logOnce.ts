type Level = "warn" | "log" | "error";

const seen = new Set<string>();

export function logOnce(key: string, message: string, level: Level = "warn") {
  if (seen.has(key)) return;
  seen.add(key);

  // eslint-disable-next-line no-console
  console[level](message);
}

export function resetLogOnce(key?: string) {
  if (!key) {
    seen.clear();
    return;
  }
  seen.delete(key);
}
