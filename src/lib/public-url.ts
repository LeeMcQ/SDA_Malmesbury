export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${trimmed}`;
}

export function routerBasepath(): string {
  const raw = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return raw === "" ? "/" : raw;
}
