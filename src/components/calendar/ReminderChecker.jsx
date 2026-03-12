import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import moment from 'moment';
import { markReminderAsSent, sendActivityReminder } from '@/services/reminders';
import { useAppSettings } from '@/lib/AppSettingsContext';

export default function ReminderChecker({ activities }) {
  const sentReminders = useRef(new Set());
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
          sentReminders.current.add(activity.id);
          
          toast.info(`Tra ${activity.reminder_minutes} minuti: ${activity.title}`, {
            duration: 10000,
          });

          const result = await sendActivityReminder({ activity, settings });

          if (result?.status === 'skipped_no_recipient') {
            toast.warning("Reminder non inviato: aggiungi un'email in Impostazioni > Promemoria o nel profilo.");
            continue;
          }

          await markReminderAsSent(activity.id);
        }
      }
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders();
    return () => clearInterval(interval);
  }, [activities, settings]);

  return null;
}
