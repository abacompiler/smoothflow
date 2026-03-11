import { apiClient } from '@/api/client';

export const sendActivityReminder = async ({ activity }) => {
  const user = await apiClient.auth.me();

  if (!user?.email) return;

  await apiClient.notifications.sendReminder({
    to: user.email,
    subject: `⏰ Reminder: ${activity.title}`,
    body: `<h2>Promemoria</h2>
      <p>L'attività <strong>${activity.title}</strong> inizierà tra ${activity.reminder_minutes} minuti.</p>
      <p><strong>Orario:</strong> ${activity.start_time} - ${activity.end_time}</p>
      ${activity.description ? `<p><strong>Descrizione:</strong> ${activity.description}</p>` : ''}
      <p>Buon lavoro!</p>`
  });
};

export const markReminderAsSent = (activityId) => apiClient.activities.update(activityId, { reminder_sent: true });
