// Rate limiter en memoria — sin dependencias externas.
// En entornos multi-instancia (múltiples workers) cada instancia tiene su
// propio mapa; para producción a escala se recomienda Redis.
// Incluye limpieza periódica de entradas expiradas para evitar memory leaks.

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Limpiar entradas expiradas cada 5 minutos para evitar crecimiento ilimitado del mapa
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Devuelve true si la IP puede continuar, false si ha superado el límite.
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 10,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  return true;
}

/**
 * Extrae la IP real del request, priorizando headers de proxy.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
