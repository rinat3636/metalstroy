export function isAdminAuthorized(request: Request): boolean {
  const password = import.meta.env.ADMIN_PASSWORD?.trim();
  if (!password) return false;

  const auth = request.headers.get("Authorization");
  if (auth === `Bearer ${password}`) return true;

  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return match?.[1] === password;
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Нет доступа" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
