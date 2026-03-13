import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getEmailValidity, isValidEmail } from '@/lib/emailValidation';

const STORAGE_KEY = 'smoothflow.settings';

const defaultReminderChannels = {
  email: true,
  notification: true
};

const defaultSettings = {
  theme: 'system',
  weekStartsOn: 'monday',
  defaultView: 'day',
  showWeekends: true,
  reminderEmail: '',
  reminderChannels: defaultReminderChannels,
  weatherEnabled: false,
  weatherUseDeviceLocation: false,
  weatherLocation: null,
  notificationQuietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00'
  },
  notificationHighPriorityOnlyInQuietHours: true,
  notificationThrottlePer10Min: 3
};

const normalizeSettings = (rawSettings = {}) => ({
  ...defaultSettings,
  ...rawSettings,
  reminderChannels: {
    ...defaultReminderChannels,
    ...(rawSettings.reminderChannels ?? {})
  },
  notificationQuietHours: {
    ...defaultSettings.notificationQuietHours,
    ...(rawSettings.notificationQuietHours ?? {})
  }
});

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
      return normalizeSettings(JSON.parse(raw));
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
      setSettings((prev) => normalizeSettings({ ...prev, [key]: valueToSet }));
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
