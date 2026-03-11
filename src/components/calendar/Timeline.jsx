import React from 'react';
import EventCard from './EventCard';
import { AnimatePresence } from 'framer-motion';
import { endsNextDay, startsOnDate, toMinutes } from '@/lib/activityUtils';

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 80;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const EVENT_GAP_PX = 6;

const getVisibleRange = (activity, selectedDate) => {
  const isStartingToday = startsOnDate(activity, selectedDate);
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

  const visibleActivities = activities
    .map((activity) => {
      const range = getVisibleRange(activity, selectedDate);
      if (!range) return null;

      return {
        activity,
        startMinutes: range.startMinutes,
        endMinutes: range.endMinutes
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
      const top = ((event.startMinutes - (START_HOUR * 60)) / 60) * HOUR_HEIGHT;
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
      {HOURS.map((hour) => (
        <div key={hour} className="flex items-start min-h-[80px] group">
          <div className="w-16 flex-shrink-0 text-xs font-medium text-muted-foreground pt-0.5 text-right pr-4">
            {String(hour).padStart(2, '0')}:00
          </div>
          <div className="flex-1 border-t border-border/80 group-hover:border-border transition-colors min-h-[80px]" />
        </div>
      ))}

      <div className="absolute top-0 left-16 right-0 pl-4" style={{ height: (TOTAL_MINUTES / 60) * HOUR_HEIGHT }}>
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
