import moment from 'moment';
import { toast } from 'sonner';

const TEN_MINUTES_MS = 10 * 60 * 1000;

class NotificationManager {
  constructor() {
    this.sentKeys = new Set();
    this.sentTimestamps = [];
  }

  _trim(nowTs) {
    this.sentTimestamps = this.sentTimestamps.filter((ts) => nowTs - ts < TEN_MINUTES_MS);
  }

  _isQuietHours(settings, now) {
    const quiet = settings.notificationQuietHours ?? { enabled: false, start: '22:00', end: '07:00' };
    if (!quiet.enabled) return false;

    const [startHour, startMin] = quiet.start.split(':').map(Number);
    const [endHour, endMin] = quiet.end.split(':').map(Number);

    const start = now.clone().hour(startHour).minute(startMin).second(0);
    const end = now.clone().hour(endHour).minute(endMin).second(0);

    if (start.isBefore(end)) {
      return now.isBetween(start, end, undefined, '[)');
    }

    return now.isSameOrAfter(start) || now.isBefore(end);
  }

  canSend({ activity, settings, dedupeKey }) {
    if (this.sentKeys.has(dedupeKey)) {
      return { allowed: false, reason: 'duplicate' };
    }

    const now = moment();
    const nowTs = Date.now();
    this._trim(nowTs);

    const maxPer10Min = settings.notificationThrottlePer10Min ?? 3;
    if (this.sentTimestamps.length >= maxPer10Min) {
      return { allowed: false, reason: 'throttled' };
    }

    const quietHours = this._isQuietHours(settings, now);
    if (quietHours && settings.notificationHighPriorityOnlyInQuietHours && activity.priority !== 'high') {
      return { allowed: false, reason: 'quiet_hours_low_priority' };
    }

    return { allowed: true, reason: 'ok' };
  }

  async sendReminder({ activity, settings, dedupeKey }) {
    const gate = this.canSend({ activity, settings, dedupeKey });
    if (!gate.allowed) return gate;

    const body = `${activity.start_time} - ${activity.end_time}`;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`Promemoria: ${activity.title}`, { body });
    } else {
      toast.info(`Promemoria: ${activity.title}`, { description: body, duration: 10000 });
    }

    this.sentKeys.add(dedupeKey);
    this.sentTimestamps.push(Date.now());

    return { allowed: true, reason: 'sent' };
  }

  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    return Notification.requestPermission();
  }
}

export const notificationManager = new NotificationManager();
