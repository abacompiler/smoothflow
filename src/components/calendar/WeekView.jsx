import moment from 'moment';
import React from 'react';
import { getCategoryColors } from './CategoryBadge';
import { Repeat } from 'lucide-react';
import { endsNextDay, occursOnDate, startsOnDate, toMinutes } from '@/lib/activityUtils';
import { getWeekDays } from '@/lib/dateUtils';

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 23;
const MIN_HOUR = 0;
const MAX_HOUR = 24;
const HOUR_HEIGHT = 56;
const EVENT_GAP_PX = 4;

function getEventBounds(activity, dateStr) {
  const overnight = endsNextDay(activity);
  const isStartingToday = startsOnDate(activity, dateStr);

  const startMinutes = isStartingToday ? toMinutes(activity.start_time) : 0;
  const endMinutes = isStartingToday
    ? (overnight ? (24 * 60) + toMinutes(activity.end_time) : toMinutes(activity.end_time))
    : toMinutes(activity.end_time);

  return {
    startMinutes: Math.max(MIN_HOUR * 60, startMinutes),
    endMinutes: Math.min(MAX_HOUR * 60, endMinutes)
  };
}

function getTimeWindow(activities, weekDays) {
  let minHour = DEFAULT_START_HOUR;
  let maxHour = DEFAULT_END_HOUR;

  weekDays.forEach((day) => {
    const dayStr = day.format('YYYY-MM-DD');

    activities
      .filter((activity) => occursOnDate(activity, dayStr))
      .forEach((activity) => {
        const { startMinutes, endMinutes } = getEventBounds(activity, dayStr);
        if (endMinutes <= startMinutes) return;

        minHour = Math.min(minHour, Math.floor(startMinutes / 60));
        maxHour = Math.max(maxHour, Math.ceil(endMinutes / 60));
      });
  });

  return {
    startHour: Math.max(MIN_HOUR, minHour),
    endHour: Math.min(MAX_HOUR, maxHour)
  };
}

function buildColumns(events) {
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  events.forEach((event) => {
    if (currentCluster.length === 0) {
      currentCluster = [event];
      clusterEnd = event.endMinutes;
      return;
    }

    if (event.startMinutes < clusterEnd) {
      currentCluster.push(event);
      clusterEnd = Math.max(clusterEnd, event.endMinutes);
      return;
    }

    clusters.push(currentCluster);
    currentCluster = [event];
    clusterEnd = event.endMinutes;
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  return clusters.flatMap((cluster) => {
    const active = [];
    let maxColumns = 0;

    const withColumns = cluster.map((event) => {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        if (active[i].endMinutes <= event.startMinutes) {
          active.splice(i, 1);
        }
      }

      const usedColumns = new Set(active.map((a) => a.column));
      let column = 0;
      while (usedColumns.has(column)) {
        column += 1;
      }

      const current = { ...event, column };
      active.push(current);
      maxColumns = Math.max(maxColumns, active.length);
      return current;
    });

    return withColumns.map((event) => ({
      ...event,
      clusterColumns: maxColumns
    }));
  });
}

export default function WeekView({ selectedDate, activities, categories, onDayClick, onEdit, weekStartsOn = 'monday', showWeekends = true }) {
  const weekDays = getWeekDays(selectedDate, weekStartsOn, showWeekends);
  const { startHour, endHour } = getTimeWindow(activities, weekDays);
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  const today = moment().format('YYYY-MM-DD');
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  const getCategoryById = (id) => categories.find((c) => c.id === id);

  const positionedEvents = weekDays.flatMap((day, dayIndex) => {
    const dayStr = day.format('YYYY-MM-DD');

    const dayEvents = activities
      .filter((activity) => occursOnDate(activity, dayStr))
      .map((activity) => {
        const range = getEventBounds(activity, dayStr);
        const windowStart = startHour * 60;
        const windowEnd = endHour * 60;

        const clampedStart = Math.max(range.startMinutes, windowStart);
        const clampedEnd = Math.min(range.endMinutes, windowEnd);

        if (clampedEnd <= clampedStart) return null;

        return {
          activity,
          startMinutes: clampedStart,
          endMinutes: clampedEnd
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
        return a.endMinutes - b.endMinutes;
      });

    return buildColumns(dayEvents).map((event) => {
      const top = ((event.startMinutes - startHour * 60) / 60) * HOUR_HEIGHT;
      const height = Math.max(((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT, 24);

      const dayWidth = 100 / weekDays.length;
      const eventWidth = dayWidth / event.clusterColumns;
      const left = (dayIndex * dayWidth) + (event.column * eventWidth);

      return {
        ...event,
        top,
        height,
        left,
        width: eventWidth
      };
    });
  });

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      {/* Day headers */}
      <div className="grid border-b" style={{ gridTemplateColumns: `repeat(${weekDays.length + 1}, minmax(0, 1fr))` }}>
        <div className="p-3" />
        {weekDays.map((day) => {
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
      <div className="overflow-y-auto max-h-[600px] no-scrollbar relative">
        {hours.map((hour) => (
          <div key={hour} className="grid min-h-[56px] border-b last:border-0" style={{ gridTemplateColumns: `repeat(${weekDays.length + 1}, minmax(0, 1fr))` }}>
            <div className="px-2 pt-1 text-[10px] font-medium text-muted-foreground text-right border-r">
              {String(hour).padStart(2, '0')}:00
            </div>
            {weekDays.map((day) => (
              <div key={`${day.format('YYYY-MM-DD')}-${hour}`} className="border-l" />
            ))}
          </div>
        ))}

        <div className="absolute top-0 right-0" style={{ height: `${totalHeight}px`, left: `${100 / (weekDays.length + 1)}%` }}>
          {positionedEvents.map(({ activity, top, height, left, width, startMinutes }) => {
            const cat = getCategoryById(activity.category_id);
            const colors = getCategoryColors(cat?.color);

            return (
              <button
                key={`${activity.id}-${left}-${startMinutes}`}
                onClick={() => onEdit(activity)}
                className={`absolute rounded px-1.5 py-1 text-[10px] font-medium border ${colors.bg} ${colors.text} ${colors.border} hover:opacity-90 transition-opacity text-left overflow-hidden`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `calc(${left}% + ${EVENT_GAP_PX / 2}px)`,
                  width: `calc(${width}% - ${EVENT_GAP_PX}px)`
                }}
              >
                <div className="flex items-center gap-1">
                  {activity.recurrence && activity.recurrence !== 'none' && <Repeat className="w-2.5 h-2.5 flex-shrink-0" />}
                  <span className="truncate">{activity.title}</span>
                </div>
                <div className="opacity-70 truncate">{activity.start_time} - {activity.end_time}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
