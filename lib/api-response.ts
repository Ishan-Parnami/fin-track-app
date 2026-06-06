export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status })
}

export function err(code: string, message: string, status: number): Response {
  return Response.json({ success: false, error: { code, message } }, { status })
}
