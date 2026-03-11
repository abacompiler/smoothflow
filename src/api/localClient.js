const STORAGE_KEYS = {
  categories: 'app_categories',
  activities: 'app_activities',
  user: 'app_user'
};

const desktopStorage = () => window['smoothflowDesktop']?.storage;

const getStorageItem = async (key) => {
  const storage = desktopStorage();
  if (storage) {
    return storage.get(key);
  }
  return localStorage.getItem(key);
};

const setStorageItem = async (key, value) => {
  const storage = desktopStorage();
  if (storage) {
    await storage.set(key, value);
    return;
  }
  localStorage.setItem(key, value);
};

const removeStorageItem = async (key) => {
  const storage = desktopStorage();
  if (storage) {
    await storage.remove(key);
    return;
  }
  localStorage.removeItem(key);
};

const readCollection = async (key) => {
  const raw = await getStorageItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCollection = async (key, data) => {
  await setStorageItem(key, JSON.stringify(data));
};

const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const ensureSeedData = async () => {
  if (!(await getStorageItem(STORAGE_KEYS.user))) {
    await setStorageItem(
      STORAGE_KEYS.user,
      JSON.stringify({
        id: 'local-user',
        email: 'local@example.com',
        role: 'admin',
        name: 'Local User'
      })
    );
  }

  if (!(await getStorageItem(STORAGE_KEYS.categories))) {
    await writeCollection(STORAGE_KEYS.categories, [
      { id: makeId(), name: 'Lavoro', color: '#3b82f6' },
      { id: makeId(), name: 'Personale', color: '#22c55e' }
    ]);
  }

  if (!(await getStorageItem(STORAGE_KEYS.activities))) {
    await writeCollection(STORAGE_KEYS.activities, []);
  }
};

const entityApi = (key) => ({
  async list() {
    await ensureSeedData();
    return readCollection(key);
  },
  async create(payload) {
    await ensureSeedData();
    const item = { id: makeId(), ...payload };
    const items = await readCollection(key);
    items.push(item);
    await writeCollection(key, items);
    return item;
  },
  async update(id, payload) {
    await ensureSeedData();
    const items = await readCollection(key);
    const updatedItems = items.map((item) => (item.id === id ? { ...item, ...payload } : item));
    const updated = updatedItems.find((item) => item.id === id);
    await writeCollection(key, updatedItems);
    return updated;
  },
  async delete(id) {
    await ensureSeedData();
    const items = await readCollection(key);
    await writeCollection(key, items.filter((item) => item.id !== id));
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
      await ensureSeedData();
      const rawUser = await getStorageItem(STORAGE_KEYS.user);
      return rawUser ? JSON.parse(rawUser) : null;
    },
    async logout(redirectUrl) {
      await removeStorageItem(STORAGE_KEYS.user);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin(_redirectUrl) {
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
      async SendEmail(_payload) {
        return { success: true };
      }
    }
  }
};
