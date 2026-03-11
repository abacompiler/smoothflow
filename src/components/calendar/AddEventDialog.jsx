import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { CalendarIcon, Clock, Bell, Repeat } from 'lucide-react';
import moment from 'moment';
import { toMinutes } from '@/lib/activityUtils';

const RECURRENCE_LABELS = {
  none: 'Una tantum',
  daily: 'Ogni giorno',
  weekly: 'Ogni settimana',
  monthly: 'Ogni mese'
};

const TIME_OPTIONS = Array.from({ length: 96 }, (_, idx) => {
  const hour = String(Math.floor(idx / 4)).padStart(2, '0');
  const minute = String((idx % 4) * 15).padStart(2, '0');
  return `${hour}:${minute}`;
});

const getRoundedQuarterDefaults = () => {
  const roundedStart = moment().seconds(0).milliseconds(0);
  const remainder = roundedStart.minute() % 15;

  if (remainder !== 0) {
    roundedStart.add(15 - remainder, 'minutes');
  }

  const roundedEnd = roundedStart.clone().add(1, 'hour');

  return {
    start_time: roundedStart.format('HH:mm'),
    end_time: roundedEnd.format('HH:mm'),
    ends_next_day: roundedEnd.isAfter(roundedStart, 'day')
  };
};

export default function AddEventDialog({ open, onOpenChange, onSave, categories, editingActivity, selectedDate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '09:00',
    end_time: '10:00',
    category_id: '',
    reminder_minutes: 15,
    priority: 'medium',
    recurrence: 'none',
    recurrence_end_date: '',
    ends_next_day: false
  });
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (editingActivity) {
      setForm({
        title: editingActivity.title || '',
        description: editingActivity.description || '',
        date: editingActivity.date || '',
        start_time: editingActivity.start_time || '09:00',
        end_time: editingActivity.end_time || '10:00',
        category_id: editingActivity.category_id || '',
        reminder_minutes: editingActivity.reminder_minutes ?? 15,
        priority: editingActivity.priority || 'medium',
        recurrence: editingActivity.recurrence || 'none',
        recurrence_end_date: editingActivity.recurrence_end_date || '',
        ends_next_day: Boolean(editingActivity.end_date && moment(editingActivity.end_date).isAfter(moment(editingActivity.date), 'day'))
      });
    } else {
      const defaults = getRoundedQuarterDefaults();

      setForm({
        title: '',
        description: '',
        date: selectedDate || '',
        start_time: defaults.start_time,
        end_time: defaults.end_time,
        category_id: '',
        reminder_minutes: 15,
        priority: 'medium',
        recurrence: 'none',
        recurrence_end_date: '',
        ends_next_day: defaults.ends_next_day
      });
    }
    setTimeError('');
  }, [editingActivity, open, selectedDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const startMinutes = toMinutes(form.start_time);
    const endMinutes = toMinutes(form.end_time);

    if (!form.ends_next_day && endMinutes <= startMinutes) {
      setTimeError('L\'orario di fine deve essere successivo all\'orario di inizio, oppure attiva "Termina il giorno successivo".');
      return;
    }

    const data = { ...form };

    data.end_date = data.ends_next_day
      ? moment(data.date).add(1, 'day').format('YYYY-MM-DD')
      : data.date;

    if (data.recurrence === 'none') {
      data.recurrence_end_date = '';
    }

    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {editingActivity ? 'Modifica Attività' : 'Nuova Attività'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Es. Riunione di team"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Descrizione</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Dettagli opzionali..."
              className="h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Inizio</Label>
              <Select
                value={form.start_time}
                onValueChange={(value) => {
                  setForm({ ...form, start_time: value });
                  setTimeError('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Fine</Label>
              <Select
                value={form.end_time}
                onValueChange={(value) => {
                  setForm({ ...form, end_time: value });
                  setTimeError('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ends-next-day"
              type="checkbox"
              checked={form.ends_next_day}
              onChange={(e) => {
                setForm({ ...form, ends_next_day: e.target.checked });
                setTimeError('');
              }}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="ends-next-day" className="text-sm">Termina il giorno successivo</Label>
          </div>

          {timeError && (
            <p className="text-sm text-destructive">{timeError}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorità</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Bassa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-3 rounded-xl border p-3 bg-muted/30">
            <Label className="flex items-center gap-1.5"><Repeat className="w-3.5 h-3.5" /> Ricorrenza</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, recurrence: value })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.recurrence === value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {form.recurrence !== 'none' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Fine ricorrenza (opzionale)</Label>
                <Input
                  type="date"
                  value={form.recurrence_end_date}
                  min={form.date}
                  onChange={e => setForm({ ...form, recurrence_end_date: e.target.value })}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Se non impostata, l'attività si ripeterà indefinitamente
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Bell className="w-3 h-3" /> Reminder</Label>
            <Select value={String(form.reminder_minutes)} onValueChange={v => setForm({ ...form, reminder_minutes: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Nessun reminder</SelectItem>
                <SelectItem value="5">5 minuti prima</SelectItem>
                <SelectItem value="10">10 minuti prima</SelectItem>
                <SelectItem value="15">15 minuti prima</SelectItem>
                <SelectItem value="30">30 minuti prima</SelectItem>
                <SelectItem value="60">1 ora prima</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">
              {editingActivity ? 'Salva Modifiche' : 'Crea Attività'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
