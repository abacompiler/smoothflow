import React from 'react';
import EventCard from './EventCard';
import { AnimatePresence } from 'framer-motion';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00

function getEventPosition(startTime) {
  const [h, m] = startTime.split(':').map(Number);
  return h + m / 60;
}

function getEventDuration(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh + em / 60) - (sh + sm / 60);
}

export default function Timeline({ activities, categories, onEdit, onDelete }) {
  const getCategoryById = (id) => categories.find(c => c.id === id);
  
  const sortedActivities = [...activities].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="relative">
      {HOURS.map((hour) => (
        <div key={hour} className="flex items-start min-h-[80px] group">
          <div className="w-16 flex-shrink-0 text-xs font-medium text-muted-foreground pt-0.5 text-right pr-4">
            {String(hour).padStart(2, '0')}:00
          </div>
          <div className="flex-1 border-t border-border/50 group-hover:border-border transition-colors min-h-[80px] relative pl-4">
            <AnimatePresence>
              {sortedActivities
                .filter(a => {
                  const pos = getEventPosition(a.start_time);
                  return Math.floor(pos) === hour;
                })
                .map(activity => (
                  <div key={activity.id} className="mb-2 first:mt-2">
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
      ))}
    </div>
  );
}
