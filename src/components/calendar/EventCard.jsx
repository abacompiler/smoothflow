import React from 'react';
import { Clock, Bell, Sparkles, Pencil, Trash2, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CategoryBadge, { getCategoryColors } from './CategoryBadge';
import { motion } from 'framer-motion';
import { endsNextDay } from '@/lib/activityUtils';

export default function EventCard({ activity, category, onEdit, onDelete }) {
  const colors = getCategoryColors(category?.color);
  const endsTomorrow = endsNextDay(activity);
  const priorityLabels = { low: 'Bassa', medium: 'Media', high: 'Alta' };
  const recurrenceLabels = { daily: 'Giornaliera', weekly: 'Settimanale', monthly: 'Mensile' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`group relative rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {activity.is_suggested && (
              <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            )}
            <h4 className={`font-semibold text-sm truncate ${colors.text}`}>
              {activity.title}
            </h4>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.start_time} - {activity.end_time}{endsTomorrow ? ' (+1g)' : ''}
            </span>
            {activity.reminder_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {activity.reminder_minutes} min
              </span>
            )}
          </div>
          
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
              {activity.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {category && <CategoryBadge category={category} />}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              activity.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
              activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
              'bg-green-100 text-green-700 border-green-200'
            }`}>
              {priorityLabels[activity.priority] || 'Media'}
            </span>
            {activity.recurrence && activity.recurrence !== 'none' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200">
                <Repeat className="w-3 h-3" />
                {recurrenceLabels[activity.recurrence]}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(activity)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(activity)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
