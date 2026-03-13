import React, { useEffect, useRef, useState } from 'react';
import { Clock, Bell, Sparkles, Pencil, Trash2, Repeat, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CategoryBadge, { getCategoryColors } from './CategoryBadge';
import { motion } from 'framer-motion';
import { endsNextDay } from '@/lib/activityUtils';

export default function EventCard({ activity, category, onEdit, onDelete }) {
  const colors = getCategoryColors(category?.color);
  const endsTomorrow = endsNextDay(activity);
  const priorityLabels = { low: 'Bassa', medium: 'Media', high: 'Alta' };
  const recurrenceLabels = { daily: 'Giornaliera', weekly: 'Settimanale', monthly: 'Mensile' };
  const cardRef = useRef(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return undefined;

    const updateCompactState = () => {
      setIsCompact(element.clientHeight < 120);
    };

    updateCompactState();

    const observer = new ResizeObserver(updateCompactState);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIsDeleteConfirmVisible(false);
  }, [activity.id]);

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    setIsDeleteConfirmVisible(true);
  };

  const handleDeleteCancel = (event) => {
    event.stopPropagation();
    setIsDeleteConfirmVisible(false);
  };

  const handleDeleteConfirm = (event) => {
    event.stopPropagation();
    setIsDeleteConfirmVisible(false);
    onDelete(activity);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`group relative h-full overflow-visible rounded-xl border ${colors.border} ${colors.bg} p-3 transition-all hover:shadow-md`}
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
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.start_time} - {activity.end_time}{endsTomorrow ? ' (+1g)' : ''}
            </span>
            {isCompact && category && (
              <span className={`inline-flex max-w-[110px] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.dot}`} />
                <span className="truncate">{category.name}</span>
              </span>
            )}
            {isCompact && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                activity.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                'bg-green-100 text-green-700 border-green-200'
              }`}>
                {priorityLabels[activity.priority] || 'Media'}
              </span>
            )}
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
            {!isCompact && category && <CategoryBadge category={category} />}
            {!isCompact && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                activity.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                'bg-green-100 text-green-700 border-green-200'
              }`}>
                {priorityLabels[activity.priority] || 'Media'}
              </span>
            )}
            {activity.recurrence && activity.recurrence !== 'none' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200">
                <Repeat className="w-3 h-3" />
                {recurrenceLabels[activity.recurrence]}
              </span>
            )}
          </div>
        </div>
        
        <div className={`relative flex gap-1 transition-opacity ${isDeleteConfirmVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isDeleteConfirmVisible ? (
            <>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:border-emerald-400" onClick={handleDeleteConfirm}>
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 bg-red-600 hover:bg-red-700 text-white border border-red-700 dark:bg-red-500 dark:hover:bg-red-600 dark:border-red-400" onClick={handleDeleteCancel}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 border border-border/60 dark:border-white/30 dark:bg-black/20" onClick={(event) => { event.stopPropagation(); onEdit(activity); }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive border border-border/60 dark:border-white/30 dark:bg-black/20" onClick={handleDeleteClick}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
