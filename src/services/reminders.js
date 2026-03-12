import { apiClient } from '@/api/client';

export const sendActivityReminder = async ({ activity, recipientEmail }) => {
  const normalizedRecipient = recipientEmail?.trim();

  if (!normalizedRecipient) {
    return { status: 'skipped_no_recipient' };
  }

  try {
    await apiClient.notifications.sendReminder({
      to: normalizedRecipient,
      subject: `⏰ Reminder: ${activity.title}`,
      body: `<h2>Promemoria</h2>
      <p>L'attività <strong>${activity.title}</strong> inizierà tra ${activity.reminder_minutes} minuti.</p>
      <p><strong>Orario:</strong> ${activity.start_time} - ${activity.end_time}</p>
      ${activity.description ? `<p><strong>Descrizione:</strong> ${activity.description}</p>` : ''}
      <p>Buon lavoro!</p>`
    });

    return { status: 'sent' };
  } catch {
    return { status: 'failed' };
  }
};

export const markReminderAsSent = (activityId) => apiClient.activities.update(activityId, { reminder_sent: true });
