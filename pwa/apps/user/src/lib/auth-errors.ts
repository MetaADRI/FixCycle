import { ApiError } from '@fixcycle/api-client';

export function messageFromError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message && error.message.length > 0 ? error.message : fallback;
  }
  if (error instanceof Error) {
    return error.message && error.message.length > 0 ? error.message : fallback;
  }
  return fallback;
}