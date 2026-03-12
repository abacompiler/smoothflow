import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getEmailValidity, isValidEmail } from '@/lib/emailValidation';

const STORAGE_KEY = 'smoothflow.settings';

const defaultSettings = {
  theme: 'system',
  weekStartsOn: 'monday',
  defaultView: 'day',
  showWeekends: true,
  reminderEmail: '',
  cloudSyncEnabled: false,
  cloudApiBaseUrl: '',
  cloudApiToken: '',
  cloudUserId: 'local-user'
};

const AppSettingsContext = createContext({
  settings: defaultSettings,
  updateSetting: () => {},
  emailValidity: 'empty',
  canSaveReminderEmail: true
});

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme !== 'system' || !window.matchMedia) {
      return undefined;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
  }, [settings.theme]);

  const value = useMemo(() => ({
    settings,
    emailValidity: getEmailValidity(settings.reminderEmail),
    canSaveReminderEmail: isValidEmail(settings.reminderEmail),
    updateSetting: (key, valueToSet) => {
      setSettings((prev) => ({ ...prev, [key]: valueToSet }));
    }
  }), [settings]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
