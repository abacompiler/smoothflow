import { apiClient } from '@/api/client';

export const sendActivityReminder = async ({ activity, settings }) => {
  const user = await apiClient.auth.me();
  const recipientEmail = settings?.reminderEmail || user?.email;

  if (!recipientEmail) {
    return { status: 'skipped_no_recipient' };
  }

  await apiClient.notifications.sendReminder({
    to: recipientEmail,
    subject: `⏰ Reminder: ${activity.title}`,
    body: `<h2>Promemoria</h2>
      <p>L'attività <strong>${activity.title}</strong> inizierà tra ${activity.reminder_minutes} minuti.</p>
      <p><strong>Orario:</strong> ${activity.start_time} - ${activity.end_time}</p>
      ${activity.description ? `<p><strong>Descrizione:</strong> ${activity.description}</p>` : ''}
      <p>Buon lavoro!</p>`
  });

  return { status: 'sent' };
};

export const markReminderAsSent = (activityId) => apiClient.activities.update(activityId, { reminder_sent: true });
