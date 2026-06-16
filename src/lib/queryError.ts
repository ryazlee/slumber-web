export function getQueryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (error) return fallback;
  return fallback;
}

export function getOptionalQueryErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  return getQueryErrorMessage(error, fallback);
}
