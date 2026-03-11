import { appClient } from '@/api/localClient';

export const apiClient = {
  auth: {
    me: () => appClient.auth.me(),
    logout: (redirectUrl) => appClient.auth.logout(redirectUrl),
    redirectToLogin: (redirectUrl) => appClient.auth.redirectToLogin(redirectUrl)
  },
  activities: {
    list: () => appClient.entities.Activity.list(),
    create: (data) => appClient.entities.Activity.create(data),
    update: (id, data) => appClient.entities.Activity.update(id, data),
    delete: (id) => appClient.entities.Activity.delete(id)
  },
  categories: {
    list: () => appClient.entities.Category.list(),
    create: (data) => appClient.entities.Category.create(data),
    update: (id, data) => appClient.entities.Category.update(id, data),
    delete: (id) => appClient.entities.Category.delete(id)
  },
  ai: {
    suggest: (payload) => appClient.integrations.Core.InvokeLLM(payload)
  },
  notifications: {
    sendReminder: (payload) => appClient.integrations.Core.SendEmail(payload)
  }
};
