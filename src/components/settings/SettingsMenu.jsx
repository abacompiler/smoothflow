import React, { useEffect, useState } from 'react';
import { Loader2, Settings2 } from 'lucide-react';
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
import {
  getPendingCloudEventsCount,
  sendCloudTestEmail,
  syncCloudEvents,
  syncCloudUserSettings
} from '@/services/cloudSync';

export default function SettingsMenu({ mobile = false }) {
  const [open, setOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [pendingCloudEvents, setPendingCloudEvents] = useState(0);
  const { settings, updateSetting, emailValidity } = useAppSettings();

  useEffect(() => {
    setEmailDraft(settings.reminderEmail);
  }, [settings.reminderEmail]);

  useEffect(() => {
    setPendingCloudEvents(getPendingCloudEventsCount());
  }, [open]);

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

  const syncNow = async () => {
    setIsSyncingCloud(true);
    const [settingsResult, eventsResult] = await Promise.allSettled([
      syncCloudUserSettings(),
      syncCloudEvents()
    ]);
    setIsSyncingCloud(false);
    setPendingCloudEvents(getPendingCloudEventsCount());

    if (settingsResult.status === 'fulfilled' && eventsResult.status === 'fulfilled') {
      if (
        settingsResult.value.status === 'synced' &&
        ['synced', 'skipped_no_events', 'skipped_not_configured'].includes(eventsResult.value.status)
      ) {
        toast.success('Sincronizzazione cloud completata.');
        return;
      }

      if (eventsResult.value.status === 'skipped_not_configured') {
        toast.warning('Configura URL API cloud e ID utente per attivare la sincronizzazione.');
        return;
      }
    }

    toast.error('Sincronizzazione cloud fallita. Verifica configurazione e connettività.');
  };

  const sendCloudEmailTest = async () => {
    setIsSendingTest(true);
    const result = await sendCloudTestEmail().catch(() => ({ status: 'failed' }));
    setIsSendingTest(false);

    if (result.status === 'sent') {
      toast.success('Email di test inviata dal servizio cloud.');
      return;
    }

    if (result.status === 'skipped_not_configured') {
      toast.warning('Configura prima il servizio cloud (abilitazione, URL API, ID utente).');
      return;
    }

    toast.error('Invio cloud test fallito.');
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
              Invia email di test (locale)
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Servizio cloud notifiche email</p>
                <p className="text-xs text-muted-foreground">Consigliato: Cloudflare Worker + Brevo gratuito.</p>
              </div>
              <Switch
                checked={settings.cloudSyncEnabled}
                onCheckedChange={(checked) => updateSetting('cloudSyncEnabled', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloud-api-url">URL API cloud</Label>
              <Input
                id="cloud-api-url"
                placeholder="https://your-worker.your-subdomain.workers.dev"
                value={settings.cloudApiBaseUrl}
                onChange={(event) => updateSetting('cloudApiBaseUrl', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloud-user-id">ID utente cloud</Label>
              <Input
                id="cloud-user-id"
                placeholder="es. user-123"
                value={settings.cloudUserId}
                onChange={(event) => updateSetting('cloudUserId', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloud-api-token">Token API cloud (opzionale)</Label>
              <Input
                id="cloud-api-token"
                type="password"
                placeholder="Bearer token"
                value={settings.cloudApiToken}
                onChange={(event) => updateSetting('cloudApiToken', event.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">Eventi in coda locale: {pendingCloudEvents}</p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={syncNow} disabled={isSyncingCloud}>
                {isSyncingCloud ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sincronizza ora
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={sendCloudEmailTest} disabled={isSendingTest}>
                {isSendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test email da cloud
              </Button>
            </div>
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
