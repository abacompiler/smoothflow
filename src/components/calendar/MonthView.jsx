import React from 'react';
import moment from 'moment';
import { getCategoryColors } from './CategoryBadge';
import { Repeat } from 'lucide-react';
import { occursOnDate } from '@/lib/activityUtils';
import { getWeekdayLabels } from '@/lib/dateUtils';

function getActivitiesForDay(activities, dateStr) {
  return activities.filter((a) => occursOnDate(a, dateStr));
}


export default function MonthView({ selectedDate, activities, categories, onDayClick, weekStartsOn = 'monday' }) {
  const monthStart = moment(selectedDate).startOf('month');
  const monthEnd = moment(selectedDate).endOf('month');
  const calStart = weekStartsOn === 'monday' ? monthStart.clone().startOf('isoWeek') : monthStart.clone().startOf('week');
  const calEnd = weekStartsOn === 'monday' ? monthEnd.clone().endOf('isoWeek') : monthEnd.clone().endOf('week');
  const today = moment().format('YYYY-MM-DD');
  const dayNames = getWeekdayLabels(weekStartsOn, true);

  const getCategoryById = (id) => categories.find(c => c.id === id);

  const days = [];
  let cur = calStart.clone();
  while (cur.isSameOrBefore(calEnd)) {
    days.push(cur.clone());
    cur.add(1, 'day');
  }

  const isCurrentMonth = (day) => day.month() === moment(selectedDate).month();

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayStr = day.format('YYYY-MM-DD');
          const dayActivities = getActivitiesForDay(activities, dayStr);
          const isToday = dayStr === today;
          const isSelected = dayStr === selectedDate;
          const inMonth = isCurrentMonth(day);

          return (
            <button
              key={dayStr}
              onClick={() => onDayClick(dayStr)}
              className={`min-h-[90px] p-1.5 border-r border-b text-left transition-colors hover:bg-muted/40 ${
                i % 7 === 6 ? 'border-r-0' : ''
              } ${!inMonth ? 'opacity-30' : ''} ${isSelected ? 'bg-accent/50' : ''}`}
            >
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                }`}>
                  {day.format('D')}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayActivities.slice(0, 3).map(a => {
                  const cat = getCategoryById(a.category_id);
                  const colors = getCategoryColors(cat?.color);
                  return (
                    <div
                      key={a.id}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${colors.bg} ${colors.text} border ${colors.border} flex items-center gap-1`}
                    >
                      {a.recurrence && a.recurrence !== 'none' && <Repeat className="w-2 h-2 flex-shrink-0" />}
                      <span className="truncate">{a.start_time} {a.title}</span>
                    </div>
                  );
                })}
                {dayActivities.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayActivities.length - 3} altri
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
