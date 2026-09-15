import type { ApiClient } from '../client';

// ---------------------------------------------------------------------------
// Promotion notifications  POST /api/v1/user/promotion/notification
// Source of truth: Api\UserController@PromotionNotification
// Returns a list of PromotionNotification models (title, message, image, url,
// created_at, expiry_date).
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  image?: string;
  url?: string;
  createdAt?: string;
  expiryDate?: string;
  raw: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseNotifications(payload: unknown): NotificationItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const items: NotificationItem[] = [];
  for (const entry of payload) {
    if (!isRecord(entry)) {
      continue;
    }
    const id =
      (typeof entry['id'] === 'string' ? entry['id'] : '') ||
      (typeof entry['id'] === 'number' ? String(entry['id']) : '');
    if (!id) {
      continue;
    }
    const title = typeof entry['title'] === 'string' ? entry['title'] : '';
    const message =
      typeof entry['message'] === 'string' ? entry['message'] : typeof entry['description'] === 'string'
        ? entry['description']
        : '';
    if (!title && !message) {
      continue;
    }
    items.push({
      id,
      title,
      message,
      image: typeof entry['image'] === 'string' && entry['image'].length > 0 ? entry['image'] : undefined,
      url: typeof entry['url'] === 'string' && entry['url'].length > 0 ? entry['url'] : undefined,
      createdAt:
        typeof entry['created_at'] === 'string' && entry['created_at'].length > 0
          ? entry['created_at']
          : undefined,
      expiryDate:
        typeof entry['expiry_date'] === 'string' && entry['expiry_date'].length > 0
          ? entry['expiry_date']
          : undefined,
      raw: entry,
    });
  }
  return items;
}

export async function fetchNotifications(client: ApiClient, signal?: AbortSignal): Promise<NotificationItem[]> {
  const envelope = await client.post<unknown>('/user/promotion/notification', {}, { scope: 'user', signal });
  return parseNotifications(envelope.data);
}
