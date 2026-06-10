import { Agent, ProxyAgent, fetch as undiciFetch } from "undici";

type TelegramResponse<T> = { ok: boolean; result?: T; description?: string };

function readEnv(name: string): string | undefined {
  try {
    const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
    const fromMeta = meta.env?.[name]?.trim();
    if (fromMeta) return fromMeta;
  } catch {
    /* scripts */
  }
  const fromProcess = process.env[name]?.trim();
  return fromProcess || undefined;
}

let dispatcher: Agent | ProxyAgent | undefined;

function getDispatcher(): Agent | ProxyAgent {
  if (dispatcher) return dispatcher;

  const proxy = readEnv("TELEGRAM_PROXY") || readEnv("HTTPS_PROXY") || readEnv("HTTP_PROXY");
  if (proxy) {
    dispatcher = new ProxyAgent(proxy);
    return dispatcher;
  }

  dispatcher = new Agent({ connect: { timeout: 60_000 } });
  return dispatcher;
}

export function getTelegramBotToken(): string | null {
  return readEnv("TELEGRAM_BOT_TOKEN") ?? null;
}

export function getTelegramProxy(): string | null {
  return readEnv("TELEGRAM_PROXY") || readEnv("HTTPS_PROXY") || readEnv("HTTP_PROXY") || null;
}

export async function telegramApi<T = unknown>(
  method: string,
  body?: Record<string, unknown>,
  timeoutMs = 70_000,
): Promise<TelegramResponse<T>> {
  const token = getTelegramBotToken();
  if (!token) {
    return { ok: false, description: "TELEGRAM_BOT_TOKEN не задан" };
  }

  try {
    const response = await undiciFetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      dispatcher: getDispatcher(),
      signal: AbortSignal.timeout(timeoutMs),
    });

    return response.json() as Promise<TelegramResponse<T>>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cause =
      error instanceof Error && "cause" in error && error.cause instanceof Error
        ? error.cause.message
        : "";
    return { ok: false, description: cause || message };
  }
}
