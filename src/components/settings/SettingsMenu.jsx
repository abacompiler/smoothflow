import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
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
import { useAppSettings } from '@/lib/AppSettingsContext';

export default function SettingsMenu({ mobile = false }) {
  const [open, setOpen] = useState(false);
  const { settings, updateSetting } = useAppSettings();

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
