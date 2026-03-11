import React from 'react';
import EventCard from './EventCard';
import { AnimatePresence } from 'framer-motion';
import { endsNextDay, startsOnDate, toMinutes } from '@/lib/activityUtils';

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 23;
const MIN_HOUR = 0;
const MAX_HOUR = 24;
const HOUR_HEIGHT = 80;
const EVENT_GAP_PX = 6;

const getEventBounds = (activity, selectedDate) => {
  const isStartingToday = startsOnDate(activity, selectedDate);
  const overnight = endsNextDay(activity);

  const startMinutes = isStartingToday ? toMinutes(activity.start_time) : 0;
  const endMinutes = isStartingToday
    ? (overnight ? (24 * 60) + toMinutes(activity.end_time) : toMinutes(activity.end_time))
    : toMinutes(activity.end_time);

  return {
    startMinutes: Math.max(MIN_HOUR * 60, startMinutes),
    endMinutes: Math.min(MAX_HOUR * 60, endMinutes)
  };
};

function getTimeWindow(activities, selectedDate) {
  let minHour = DEFAULT_START_HOUR;
  let maxHour = DEFAULT_END_HOUR;

  activities.forEach((activity) => {
    const { startMinutes, endMinutes } = getEventBounds(activity, selectedDate);
    if (endMinutes <= startMinutes) return;

    minHour = Math.min(minHour, Math.floor(startMinutes / 60));
    maxHour = Math.max(maxHour, Math.ceil(endMinutes / 60));
  });

  return {
    startHour: Math.max(MIN_HOUR, minHour),
    endHour: Math.min(MAX_HOUR, maxHour)
  };
}

export default function Timeline({ activities, categories, onEdit, onDelete, selectedDate }) {
  const getCategoryById = (id) => categories.find((c) => c.id === id);

  const { startHour, endHour } = getTimeWindow(activities, selectedDate);
  const totalMinutes = (endHour - startHour) * 60;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const visibleActivities = activities
    .map((activity) => {
      const { startMinutes, endMinutes } = getEventBounds(activity, selectedDate);
      const windowStart = startHour * 60;
      const windowEnd = endHour * 60;
      const clampedStart = Math.max(startMinutes, windowStart);
      const clampedEnd = Math.min(endMinutes, windowEnd);

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

  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  visibleActivities.forEach((event) => {
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

  const positionedActivities = clusters.flatMap((cluster) => {
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

    return withColumns.map((event) => {
      const top = ((event.startMinutes - (startHour * 60)) / 60) * HOUR_HEIGHT;
      const height = ((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT;
      const widthPercent = 100 / maxColumns;
      const leftPercent = event.column * widthPercent;

      return {
        ...event,
        top,
        height,
        widthPercent,
        leftPercent
      };
    });
  });

  return (
    <div className="relative">
      {hours.map((hour) => (
        <div key={hour} className="flex items-start min-h-[80px] group">
          <div className="w-16 flex-shrink-0 text-xs font-medium text-muted-foreground pt-0.5 text-right pr-4">
            {String(hour).padStart(2, '0')}:00
          </div>
          <div className="flex-1 border-t border-border/80 group-hover:border-border transition-colors min-h-[80px]" />
        </div>
      ))}

      <div className="absolute top-0 left-16 right-0 pl-4" style={{ height: (totalMinutes / 60) * HOUR_HEIGHT }}>
        <AnimatePresence>
          {positionedActivities.map(({ activity, top, height, leftPercent, widthPercent }) => (
            <div
              key={activity.id}
              className="absolute"
              style={{
                top: `${top}px`,
                height: `${height}px`,
                left: `calc(${leftPercent}% + ${EVENT_GAP_PX / 2}px)`,
                width: `calc(${widthPercent}% - ${EVENT_GAP_PX}px)`
              }}
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
