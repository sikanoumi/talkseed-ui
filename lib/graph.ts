export async function graphFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Graph ${res.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}