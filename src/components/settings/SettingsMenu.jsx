import React, { useEffect, useState } from 'react';
import { CloudSun, Loader2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppSettings } from '@/lib/AppSettingsContext';
import { isValidEmail } from '@/lib/emailValidation';
import { toast } from 'sonner';
import { sendActivityReminder } from '@/services/reminders';
import { notificationManager } from '@/services/notificationManager';

export default function SettingsMenu({ mobile = false }) {
  const [open, setOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('unsupported');
  const { settings, updateSetting, emailValidity } = useAppSettings();

  useEffect(() => {
    setEmailDraft(settings.reminderEmail);
  }, [settings.reminderEmail]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [open]);

  const reminderChannels = settings.reminderChannels ?? { email: true, notification: true };
  const noReminderChannelActive = !reminderChannels.email && !reminderChannels.notification;

  const saveReminderEmail = () => {
    const normalizedEmail = emailDraft.trim();

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Formato email non valido (es: nome@esempio.it).');
      toast.warning('Email non salvata: formato non valido.');
      return false;
    }

    setEmailError('');
    if (normalizedEmail !== settings.reminderEmail) {
      updateSetting('reminderEmail', normalizedEmail);
    }
    return true;
  };

  const sendTestEmail = async () => {
    if (!saveReminderEmail()) return;

    const targetEmail = emailDraft.trim();
    if (!targetEmail) {
      toast.warning('Inserisci un\'email prima di inviare un test.');
      return;
    }

    setIsSendingTest(true);
    const result = await sendActivityReminder({
      recipientEmail: targetEmail,
      activity: {
        title: 'Email di test SmoothFlow',
        reminder_minutes: 0,
        start_time: '--:--',
        end_time: '--:--',
        description: 'Questo è un invio di test dalle impostazioni.'
      }
    });
    setIsSendingTest(false);

    if (result?.status === 'sent') {
      toast.success('Email di test inviata con successo.');
      return;
    }

    toast.error('Invio email di test fallito. Riprova tra poco.');
  };

  const sendTestNotification = async () => {
    const permission = await notificationManager.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'denied') {
      toast.error('Permesso notifiche negato dal browser.');
      return;
    }

    await notificationManager.sendReminder({
      activity: { id: 'test', title: 'Notifica di test', start_time: 'adesso', end_time: '', priority: 'high' },
      settings,
      dedupeKey: `test:${Date.now()}`
    });
    toast.success('Notifica di test inviata.');
  };

  const updateReminderChannel = (channel, checked) => {
    updateSetting('reminderChannels', {
      ...reminderChannels,
      [channel]: checked
    });
  };

  const setQuietHoursField = (key, value) => {
    updateSetting('notificationQuietHours', {
      ...(settings.notificationQuietHours ?? {}),
      [key]: value
    });
  };

  const updateWeatherLocationFromDevice = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalizzazione non disponibile su questo dispositivo.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateSetting('weatherLocation', {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        updateSetting('weatherUseDeviceLocation', true);
        toast.success('Posizione meteo aggiornata.');
      },
      () => toast.error('Permesso geolocalizzazione negato o non disponibile.')
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className={`justify-start gap-2 ${mobile ? 'w-full' : 'w-full'}`}>
          <Settings2 className="w-4 h-4" />
          Impostazioni
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impostazioni calendario</DialogTitle>
          <DialogDescription>
            Personalizza visualizzazione e comportamento del planner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Automatico (sistema)</SelectItem>
                <SelectItem value="light">Chiaro</SelectItem>
                <SelectItem value="dark">Scuro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Inizio settimana</Label>
            <Select value={settings.weekStartsOn} onValueChange={(value) => updateSetting('weekStartsOn', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona inizio settimana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Lunedì</SelectItem>
                <SelectItem value="sunday">Domenica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vista predefinita</Label>
            <Select value={settings.defaultView} onValueChange={(value) => updateSetting('defaultView', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Giorno</SelectItem>
                <SelectItem value="week">Settimana</SelectItem>
                <SelectItem value="month">Mese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-email">Promemoria</Label>
            <Input
              id="reminder-email"
              type="email"
              placeholder="nome@esempio.it"
              value={emailDraft}
              onChange={(event) => {
                setEmailDraft(event.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={saveReminderEmail}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveReminderEmail();
                }
              }}
            />
            {emailError ? (
              <p className="text-xs text-destructive">{emailError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Se vuoto, il reminder email non viene inviato</p>
            )}
            <p className="text-xs text-muted-foreground">
              Stato email: {emailValidity === 'valid' ? 'valida' : emailValidity === 'invalid' ? 'non valida' : 'non impostata'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sendTestEmail}
              disabled={isSendingTest}
            >
              {isSendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Invia email di test
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Canali reminder</p>
            <div className="flex items-center justify-between">
              <p className="text-sm">Email</p>
              <Switch
                checked={reminderChannels.email}
                onCheckedChange={(checked) => updateReminderChannel('email', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Notifiche</p>
              <Switch
                checked={reminderChannels.notification}
                onCheckedChange={(checked) => updateReminderChannel('notification', checked)}
              />
            </div>
            {noReminderChannelActive ? (
              <p className="text-xs text-amber-600">Nessun canale attivo: i reminder non verranno recapitati</p>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Notifiche intelligenti</p>
            <p className="text-xs text-muted-foreground">Permesso browser: {notificationPermission}</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Silenzio da</Label>
                <Input
                  type="time"
                  value={settings.notificationQuietHours?.start ?? '22:00'}
                  onChange={(event) => setQuietHoursField('start', event.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">a</Label>
                <Input
                  type="time"
                  value={settings.notificationQuietHours?.end ?? '07:00'}
                  onChange={(event) => setQuietHoursField('end', event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Abilita orari silenziosi</p>
              <Switch
                checked={settings.notificationQuietHours?.enabled ?? false}
                onCheckedChange={(checked) => setQuietHoursField('enabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Solo priorità alta in orari silenziosi</p>
              <Switch
                checked={settings.notificationHighPriorityOnlyInQuietHours}
                onCheckedChange={(checked) => updateSetting('notificationHighPriorityOnlyInQuietHours', checked)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Massimo notifiche ogni 10 minuti</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.notificationThrottlePer10Min}
                onChange={(event) => updateSetting('notificationThrottlePer10Min', Number(event.target.value || 1))}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={sendTestNotification}>Invia notifica di test</Button>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium inline-flex items-center gap-1"><CloudSun className="w-4 h-4" /> Meteo sulle attività</p>
            <div className="flex items-center justify-between">
              <p className="text-sm">Mostra meteo accanto all'orario</p>
              <Switch
                checked={settings.weatherEnabled}
                onCheckedChange={(checked) => updateSetting('weatherEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Usa posizione del dispositivo</p>
              <Switch
                checked={settings.weatherUseDeviceLocation}
                onCheckedChange={(checked) => {
                  updateSetting('weatherUseDeviceLocation', checked);
                  if (checked) updateWeatherLocationFromDevice();
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Posizione: {settings.weatherLocation?.lat ? `${settings.weatherLocation.lat.toFixed(3)}, ${settings.weatherLocation.lon.toFixed(3)}` : 'non impostata'}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={updateWeatherLocationFromDevice}>Aggiorna posizione</Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Mostra weekend in vista settimana</p>
              <p className="text-xs text-muted-foreground">Disattiva per concentrarti sui giorni lavorativi.</p>
            </div>
            <Switch
              checked={settings.showWeekends}
              onCheckedChange={(checked) => updateSetting('showWeekends', checked)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
