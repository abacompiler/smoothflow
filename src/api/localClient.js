const STORAGE_KEYS = {
  categories: 'app_categories',
  activities: 'app_activities',
  user: 'app_user'
};

const readCollection = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCollection = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const ensureSeedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.user)) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({
      id: 'local-user',
      email: 'local@example.com',
      role: 'admin',
      name: 'Local User'
    }));
  }

  if (!localStorage.getItem(STORAGE_KEYS.categories)) {
    writeCollection(STORAGE_KEYS.categories, [
      { id: makeId(), name: 'Lavoro', color: '#3b82f6' },
      { id: makeId(), name: 'Personale', color: '#22c55e' }
    ]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.activities)) {
    writeCollection(STORAGE_KEYS.activities, []);
  }
};

const entityApi = (key) => ({
  async list() {
    ensureSeedData();
    return readCollection(key);
  },
  async create(payload) {
    ensureSeedData();
    const item = { id: makeId(), ...payload };
    const items = readCollection(key);
    items.push(item);
    writeCollection(key, items);
    return item;
  },
  async update(id, payload) {
    ensureSeedData();
    const items = readCollection(key);
    const updatedItems = items.map((item) => (item.id === id ? { ...item, ...payload } : item));
    const updated = updatedItems.find((item) => item.id === id);
    writeCollection(key, updatedItems);
    return updated;
  },
  async delete(id) {
    ensureSeedData();
    const items = readCollection(key);
    writeCollection(key, items.filter((item) => item.id !== id));
    return { success: true };
  }
});

const parsePromptIntent = (prompt) => {
  const text = prompt.toLowerCase();

  if (text.includes('studio') || text.includes('leggere')) {
    return [{ title: 'Sessione di studio', description: 'Blocco di studio concentrato.', start_time: '09:00', end_time: '10:30', priority: 'high' }];
  }

  if (text.includes('allen') || text.includes('palestra') || text.includes('sport')) {
    return [{ title: 'Allenamento', description: 'Sessione di allenamento moderata.', start_time: '18:00', end_time: '19:00', priority: 'medium' }];
  }

  return [{ title: 'Blocco focus', description: 'Tempo dedicato alle attività prioritarie.', start_time: '10:00', end_time: '11:30', priority: 'medium' }];
};

export const appClient = {
  auth: {
    async me() {
      ensureSeedData();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
    },
    logout(redirectUrl) {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin() {
      // No-op in standalone local mode.
    }
  },
  entities: {
    Category: entityApi(STORAGE_KEYS.categories),
    Activity: entityApi(STORAGE_KEYS.activities)
  },
  integrations: {
    Core: {
      async InvokeLLM({ prompt }) {
        return { suggestions: parsePromptIntent(prompt) };
      },
      async SendEmail() {
        return { success: true };
      }
    }
  }
};
