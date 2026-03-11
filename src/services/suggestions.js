import { apiClient } from '@/api/client';

export const getSmartSuggestions = async ({ activities, categories, selectedDate, prompt }) => {
  const existingActivities = activities.map((a) => ({
    title: a.title,
    start: a.start_time,
    end: a.end_time
  }));

  const categoryNames = categories.map((c) => c.name).join(', ');

  const result = await apiClient.ai.suggest({
    prompt: `Sei un assistente per la pianificazione della giornata. 
L'utente vuole organizzare la sua giornata del ${selectedDate}.

Impegni già esistenti:
${JSON.stringify(existingActivities)}

Categorie disponibili: ${categoryNames || 'Nessuna'}

L'utente chiede: "${prompt}"

Suggerisci come suddividere il tempo rimanente della giornata (ore 6:00-22:00) considerando gli impegni esistenti. 
Suggerisci slot di tempo realistici con pause appropriate.
Per ogni suggerimento usa una delle categorie disponibili se pertinente, altrimenti lascia vuoto.`,
    response_json_schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              start_time: { type: 'string' },
              end_time: { type: 'string' },
              category_name: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        }
      }
    }
  });

  return result.suggestions || [];
};
