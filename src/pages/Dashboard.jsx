import React, { useState } from 'react';
import { apiClient } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import Timeline from '../components/calendar/Timeline';
import WeekView from '../components/calendar/WeekView';
import MonthView from '../components/calendar/MonthView';
import AddEventDialog from '../components/calendar/AddEventDialog';
import SmartSuggestion from '../components/calendar/SmartSuggestion';
import DayStats from '../components/calendar/DayStats';
import ReminderChecker from '../components/calendar/ReminderChecker';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month'
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const queryClient = useQueryClient();

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => apiClient.activities.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.categories.list()
  });

  // Calcola le attività del giorno selezionato, incluse le ricorrenti
  const todayActivities = activities.filter(a => {
    if (!a.date) return false;
    const actStart = moment(a.date);
    const selected = moment(selectedDate);

    // Attività esatta (non ricorrente o data di partenza)
    if (a.date === selectedDate) return true;
    if (!a.recurrence || a.recurrence === 'none') return false;

    // La data selezionata deve essere >= data di inizio
    if (selected.isBefore(actStart)) return false;

    // Controlla data fine ricorrenza
    if (a.recurrence_end_date && selected.isAfter(moment(a.recurrence_end_date))) return false;

    if (a.recurrence === 'daily') return true;
    if (a.recurrence === 'weekly') return selected.day() === actStart.day();
    if (a.recurrence === 'monthly') return selected.date() === actStart.date();
    return false;
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.activities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setDialogOpen(false);
      setEditingActivity(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.activities.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setDialogOpen(false);
      setEditingActivity(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.activities.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] })
  });

  const handleSave = (form) => {
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setDialogOpen(true);
  };

  const handleDelete = (activity) => {
    deleteMutation.mutate(activity.id);
  };

  const handleAddSuggested = (data) => {
    createMutation.mutate(data);
  };

  const navigate = (direction) => {
    const unit = viewMode === 'day' ? 'days' : viewMode === 'week' ? 'weeks' : 'months';
    setSelectedDate(moment(selectedDate).add(direction, unit).format('YYYY-MM-DD'));
  };

  const isToday = selectedDate === moment().format('YYYY-MM-DD');

  const getHeaderLabel = () => {
    if (viewMode === 'day') {
      return isToday ? 'Oggi' : moment(selectedDate).format('dddd');
    }
    if (viewMode === 'week') {
      const ws = moment(selectedDate).startOf('week');
      const we = moment(selectedDate).endOf('week');
      return `${ws.format('D MMM')} – ${we.format('D MMM YYYY')}`;
    }
    return moment(selectedDate).format('MMMM YYYY');
  };

  const getSubLabel = () => {
    if (viewMode === 'day') return moment(selectedDate).format('D MMMM YYYY');
    return null;
  };

  // Week days for mini calendar (day view only)
  const weekStart = moment(selectedDate).startOf('week');
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, 'days'));

  return (
    <div className="min-h-screen bg-background">
      <ReminderChecker activities={activities} />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">
                {getHeaderLabel()}
              </h1>
              {getSubLabel() && (
                <p className="text-muted-foreground mt-1">{getSubLabel()}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* View mode switcher */}
              <div className="flex rounded-lg border overflow-hidden">
                {['day', 'week', 'month'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {{ day: 'Giorno', week: 'Settimana', month: 'Mese' }[mode]}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(moment().format('YYYY-MM-DD'))}>
                Oggi
              </Button>
              <Button size="sm" onClick={() => { setEditingActivity(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1.5" />
                Nuova
              </Button>
            </div>
          </div>

          {/* Navigation + mini week (day view only) */}
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {viewMode === 'day' && (
              <div className="flex-1 grid grid-cols-7 gap-1.5">
                {weekDays.map(day => {
                  const dayStr = day.format('YYYY-MM-DD');
                  const dayActivities = activities.filter(a => {
                    if (!a.date) return false;
                    const actStart = moment(a.date);
                    const d = moment(dayStr);
                    if (a.date === dayStr) return true;
                    if (!a.recurrence || a.recurrence === 'none') return false;
                    if (d.isBefore(actStart)) return false;
                    if (a.recurrence_end_date && d.isAfter(moment(a.recurrence_end_date))) return false;
                    if (a.recurrence === 'daily') return true;
                    if (a.recurrence === 'weekly') return d.day() === actStart.day();
                    if (a.recurrence === 'monthly') return d.date() === actStart.date();
                    return false;
                  });
                  const isSelected = dayStr === selectedDate;
                  const isDayToday = dayStr === moment().format('YYYY-MM-DD');
                  return (
                    <button
                      key={dayStr}
                      onClick={() => setSelectedDate(dayStr)}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                        isSelected ? 'bg-primary text-primary-foreground shadow-sm'
                        : isDayToday ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase opacity-70">{day.format('ddd')}</span>
                      <span className="text-lg font-semibold mt-0.5">{day.format('D')}</span>
                      {dayActivities.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {dayActivities.slice(0, 3).map((_, i) => (
                            <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground/60' : 'bg-primary/60'}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode !== 'day' && <div className="flex-1" />}

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Content Grid */}
        {viewMode === 'day' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border p-4 md:p-6">
                {todayActivities.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Nessuna attività</p>
                    <p className="text-sm text-muted-foreground mt-1">Aggiungi il tuo primo impegno della giornata</p>
                    <Button size="sm" className="mt-4" onClick={() => { setEditingActivity(null); setDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Aggiungi Attività
                    </Button>
                  </div>
                ) : (
                  <Timeline activities={todayActivities} categories={categories} onEdit={handleEdit} onDelete={handleDelete} />
                )}
              </div>
            </div>
            <div className="space-y-4">
              <DayStats activities={todayActivities} />
              <SmartSuggestion activities={todayActivities} categories={categories} selectedDate={selectedDate} onAddSuggested={handleAddSuggested} />
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <WeekView
            selectedDate={selectedDate}
            activities={activities}
            categories={categories}
            onDayClick={(d) => { setSelectedDate(d); setViewMode('day'); }}
            onEdit={handleEdit}
          />
        )}

        {viewMode === 'month' && (
          <MonthView
            selectedDate={selectedDate}
            activities={activities}
            categories={categories}
            onDayClick={(d) => { setSelectedDate(d); setViewMode('day'); }}
          />
        )}
      </div>

      <AddEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        categories={categories}
        editingActivity={editingActivity}
        selectedDate={selectedDate}
      />
    </div>
  );
}
