import React from 'react';
import EventCard from './EventCard';
import { AnimatePresence } from 'framer-motion';
import { endsNextDay, toMinutes } from '@/lib/activityUtils';

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 80;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

const getVisibleRange = (activity, selectedDate) => {
  const isStartingToday = activity.date === selectedDate;
  const overnight = endsNextDay(activity);

  let startMinutes = isStartingToday ? toMinutes(activity.start_time) : 0;
  let endMinutes = isStartingToday
    ? (overnight ? (24 * 60) + toMinutes(activity.end_time) : toMinutes(activity.end_time))
    : toMinutes(activity.end_time);

  const windowStart = START_HOUR * 60;
  const windowEnd = END_HOUR * 60;

  startMinutes = Math.max(startMinutes, windowStart);
  endMinutes = Math.min(endMinutes, windowEnd);

  if (endMinutes <= startMinutes) return null;

  return { startMinutes, endMinutes };
};

export default function Timeline({ activities, categories, onEdit, onDelete, selectedDate }) {
  const getCategoryById = (id) => categories.find((c) => c.id === id);

  const positionedActivities = activities
    .map((activity) => {
      const range = getVisibleRange(activity, selectedDate);
      if (!range) return null;

      const startOffset = range.startMinutes - (START_HOUR * 60);
      const duration = range.endMinutes - range.startMinutes;

      return {
        activity,
        top: (startOffset / 60) * HOUR_HEIGHT,
        height: Math.max((duration / 60) * HOUR_HEIGHT, 48)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top);

  return (
    <div className="relative">
      {HOURS.map((hour) => (
        <div key={hour} className="flex items-start min-h-[80px] group">
          <div className="w-16 flex-shrink-0 text-xs font-medium text-muted-foreground pt-0.5 text-right pr-4">
            {String(hour).padStart(2, '0')}:00
          </div>
          <div className="flex-1 border-t border-border/50 group-hover:border-border transition-colors min-h-[80px]" />
        </div>
      ))}

      <div className="absolute top-0 left-16 right-0 pl-4" style={{ height: (TOTAL_MINUTES / 60) * HOUR_HEIGHT }}>
        <AnimatePresence>
          {positionedActivities.map(({ activity, top, height }) => (
            <div
              key={activity.id}
              className="absolute left-0 right-0 pr-1"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <EventCard
                activity={activity}
                category={getCategoryById(activity.category_id)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
