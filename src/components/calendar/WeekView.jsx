import React from 'react';
import moment from 'moment';
import { getCategoryColors } from './CategoryBadge';
import { Repeat } from 'lucide-react';
import { occursOnDate } from '@/lib/activityUtils';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00

function getActivitiesForDay(activities, dateStr) {
  return activities.filter((a) => occursOnDate(a, dateStr));
}

export default function WeekView({ selectedDate, activities, categories, onDayClick, onEdit }) {
  const weekStart = moment(selectedDate).startOf('week');
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, 'days'));
  const today = moment().format('YYYY-MM-DD');

  const getCategoryById = (id) => categories.find(c => c.id === id);

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-3" />
        {weekDays.map(day => {
          const dayStr = day.format('YYYY-MM-DD');
          const isToday = dayStr === today;
          const isSelected = dayStr === selectedDate;
          return (
            <button
              key={dayStr}
              onClick={() => onDayClick(dayStr)}
              className={`p-3 text-center border-l transition-colors hover:bg-muted/50 ${isSelected ? 'bg-accent' : ''}`}
            >
              <div className={`text-[10px] font-medium uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.format('ddd')}
              </div>
              <div className={`text-lg font-semibold mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                isToday ? 'bg-primary text-primary-foreground' : ''
              }`}>
                {day.format('D')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[600px] no-scrollbar">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 min-h-[56px] border-b last:border-0">
            <div className="px-2 pt-1 text-[10px] font-medium text-muted-foreground text-right border-r">
              {String(hour).padStart(2, '0')}:00
            </div>
            {weekDays.map(day => {
              const dayStr = day.format('YYYY-MM-DD');
              const dayActivities = getActivitiesForDay(activities, dayStr).filter(a => {
                const [h] = a.start_time.split(':').map(Number);
                return h === hour;
              });
              return (
                <div key={dayStr} className="border-l p-1 space-y-0.5">
                  {dayActivities.map(a => {
                    const cat = getCategoryById(a.category_id);
                    const colors = getCategoryColors(cat?.color);
                    return (
                      <button
                        key={a.id}
                        onClick={() => onEdit(a)}
                        className={`w-full text-left rounded px-1.5 py-1 text-[10px] font-medium truncate border ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center gap-1">
                          {a.recurrence && a.recurrence !== 'none' && <Repeat className="w-2.5 h-2.5 flex-shrink-0" />}
                          <span className="truncate">{a.title}</span>
                        </div>
                        <div className="opacity-70">{a.start_time}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
