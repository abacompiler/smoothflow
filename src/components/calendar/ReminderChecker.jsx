import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import moment from 'moment';
import { markReminderAsSent, sendActivityReminder } from '@/services/reminders';
import { useAppSettings } from '@/lib/AppSettingsContext';

export default function ReminderChecker({ activities }) {
  const sentReminders = useRef(new Set());
  const missingRecipientWarnings = useRef(new Set());
  const { settings } = useAppSettings();

  useEffect(() => {
    const checkReminders = async () => {
      const now = moment();

      for (const activity of activities) {
        if (activity.reminder_sent || sentReminders.current.has(activity.id)) continue;
        if (!activity.reminder_minutes || activity.reminder_minutes === 0) continue;

        const eventTime = moment(`${activity.date} ${activity.start_time}`, 'YYYY-MM-DD HH:mm');
        const reminderTime = eventTime.clone().subtract(activity.reminder_minutes, 'minutes');

        if (now.isSameOrAfter(reminderTime) && now.isBefore(eventTime)) {
          const result = await sendActivityReminder({ activity, recipientEmail: settings.reminderEmail });

          if (result?.status === 'skipped_no_recipient') {
            if (!missingRecipientWarnings.current.has(activity.id)) {
              toast.warning("Reminder non inviato: inserisci un'email in Impostazioni > Promemoria.");
              missingRecipientWarnings.current.add(activity.id);
            }
            continue;
          }

          if (result?.status === 'skipped_invalid_recipient') {
            if (!missingRecipientWarnings.current.has(activity.id)) {
              toast.warning("Reminder non inviato: email promemoria non valida in Impostazioni.");
              missingRecipientWarnings.current.add(activity.id);
            }
            continue;
          }

          if (result?.status === 'failed') {
            toast.error('Invio reminder fallito. Riproverò automaticamente tra poco.');
            continue;
          }

          sentReminders.current.add(activity.id);
          missingRecipientWarnings.current.delete(activity.id);

          toast.info(`Promemoria inviato: ${activity.title}`, {
            duration: 10000,
          });

          await markReminderAsSent(activity.id);
        }
      }
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders();
    return () => clearInterval(interval);
  }, [activities, settings.reminderEmail]);

  return null;
}
