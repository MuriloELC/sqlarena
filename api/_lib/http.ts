export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export function assertMethod(req: any, method: string) {
  if (req.method !== method) {
    throw new HttpError(405, `Metodo ${req.method} nao permitido.`);
  }
}

export function readBody<T extends Record<string, unknown>>(req: any): T {
  if (!req.body) return {} as T;
  if (typeof req.body === "string") return JSON.parse(req.body) as T;
  return req.body as T;
}

export function getBearerToken(req: any) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Sessao ausente ou invalida.");
  }
  return header.slice("Bearer ".length);
}

export function sendError(res: any, error: unknown) {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ status: "error", message: error.message });
  }

  const message = error instanceof Error ? error.message : "Erro inesperado.";
  return res.status(500).json({ status: "error", message });
}
