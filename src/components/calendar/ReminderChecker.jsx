import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import moment from 'moment';

export default function ReminderChecker({ activities }) {
  const sentReminders = useRef(new Set());

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

          const user = await base44.auth.me();
          if (user?.email) {
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: `⏰ Reminder: ${activity.title}`,
              body: `<h2>Promemoria</h2>
                <p>L'attività <strong>${activity.title}</strong> inizierà tra ${activity.reminder_minutes} minuti.</p>
                <p><strong>Orario:</strong> ${activity.start_time} - ${activity.end_time}</p>
                ${activity.description ? `<p><strong>Descrizione:</strong> ${activity.description}</p>` : ''}
                <p>Buon lavoro!</p>`
            });
          }

          await base44.entities.Activity.update(activity.id, { reminder_sent: true });
        }
      }
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders();
    return () => clearInterval(interval);
  }, [activities]);

  return null;
}
