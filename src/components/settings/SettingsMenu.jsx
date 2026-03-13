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

export default function SettingsMenu({ mobile = false }) {
  const [open, setOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const { settings, updateSetting, emailValidity } = useAppSettings();

  useEffect(() => {
    setEmailDraft(settings.reminderEmail);
  }, [settings.reminderEmail]);

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

  const updateReminderChannel = (channel, checked) => {
    updateSetting('reminderChannels', {
      ...reminderChannels,
      [channel]: checked
    });
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
