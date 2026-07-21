export const DEFAULT_API_PROXY_TARGET = "http://127.0.0.1:8000";

export function resolveApiProxyTarget(
  environment: Record<string, string>,
): string {
  const configuredTarget =
    environment.FIREFIGHTER_TOOLS_API_TARGET ?? DEFAULT_API_PROXY_TARGET;
  const target = new URL(configuredTarget);

  if (
    target.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)
  ) {
    throw new Error(
      "FIREFIGHTER_TOOLS_API_TARGET must be an HTTP URL on the local computer.",
    );
  }

  return target.origin;
}
