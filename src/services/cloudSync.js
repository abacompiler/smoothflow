const SETTINGS_STORAGE_KEY = 'smoothflow.settings';
const EVENTS_QUEUE_STORAGE_KEY = 'smoothflow.cloud.pendingEvents';

const readJsonStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getCloudConfig = () => {
  const settings = readJsonStorage(SETTINGS_STORAGE_KEY, {});
  return {
    enabled: Boolean(settings.cloudSyncEnabled),
    baseUrl: settings.cloudApiBaseUrl?.trim(),
    token: settings.cloudApiToken?.trim(),
    userId: settings.cloudUserId?.trim(),
    reminderEmail: settings.reminderEmail?.trim() || ''
  };
};

const buildHeaders = (config) => {
  const headers = { 'Content-Type': 'application/json' };
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }
  return headers;
};

const enqueueEvent = (event) => {
  const queue = readJsonStorage(EVENTS_QUEUE_STORAGE_KEY, []);
  queue.push(event);
  writeJsonStorage(EVENTS_QUEUE_STORAGE_KEY, queue);
};

export const trackActivityEvent = (type, activity, meta = {}) => {
  if (!activity) return;

  enqueueEvent({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    occurredAt: new Date().toISOString(),
    entityType: 'activity',
    eventType: type,
    entityId: activity.id ?? null,
    payload: activity,
    meta
  });
};

export const syncCloudEvents = async () => {
  const config = getCloudConfig();
  if (!config.enabled || !config.baseUrl || !config.userId) {
    return { status: 'skipped_not_configured' };
  }

  const queue = readJsonStorage(EVENTS_QUEUE_STORAGE_KEY, []);
  if (!queue.length) {
    return { status: 'skipped_no_events' };
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v1/events/bulk`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({ user_id: config.userId, events: queue })
  });

  if (!response.ok) {
    return { status: 'failed', code: response.status };
  }

  const payload = await response.json().catch(() => ({}));
  const acknowledgedIds = new Set(payload?.acknowledged_event_ids ?? queue.map((item) => item.id));
  const remaining = queue.filter((item) => !acknowledgedIds.has(item.id));
  writeJsonStorage(EVENTS_QUEUE_STORAGE_KEY, remaining);

  return {
    status: 'synced',
    sent: queue.length - remaining.length,
    remaining: remaining.length
  };
};

export const syncCloudUserSettings = async () => {
  const config = getCloudConfig();
  if (!config.enabled || !config.baseUrl || !config.userId) {
    return { status: 'skipped_not_configured' };
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v1/users/settings`, {
    method: 'PUT',
    headers: buildHeaders(config),
    body: JSON.stringify({
      user_id: config.userId,
      reminder_email: config.reminderEmail,
      email_notifications_enabled: Boolean(config.reminderEmail)
    })
  });

  if (!response.ok) {
    return { status: 'failed', code: response.status };
  }

  return { status: 'synced' };
};

export const sendCloudTestEmail = async () => {
  const config = getCloudConfig();
  if (!config.enabled || !config.baseUrl || !config.userId) {
    return { status: 'skipped_not_configured' };
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v1/notifications/test-email`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({ user_id: config.userId })
  });

  if (!response.ok) {
    return { status: 'failed', code: response.status };
  }

  return { status: 'sent' };
};

export const getPendingCloudEventsCount = () => readJsonStorage(EVENTS_QUEUE_STORAGE_KEY, []).length;
