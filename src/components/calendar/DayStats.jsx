import React from 'react';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getActivityDurationMinutes } from '@/lib/activityUtils';

export default function DayStats({ activities }) {
  const totalMinutes = activities.reduce((sum, a) => sum + getActivityDurationMinutes(a), 0);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const highPriority = activities.filter(a => a.priority === 'high').length;
  const freeMinutes = (16 * 60) - totalMinutes; // 6:00-22:00 = 16h
  const freeHours = Math.floor(Math.max(0, freeMinutes) / 60);
  const freeMins = Math.max(0, freeMinutes) % 60;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-card rounded-xl border p-4 text-center">
        <Clock className="w-4 h-4 text-primary mx-auto mb-1.5" />
        <p className="text-lg font-bold">{hours}h {mins > 0 ? `${mins}m` : ''}</p>
        <p className="text-xs text-muted-foreground">Impegnato</p>
      </div>
      <div className="bg-card rounded-xl border p-4 text-center">
        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1.5" />
        <p className="text-lg font-bold">{freeHours}h {freeMins > 0 ? `${freeMins}m` : ''}</p>
        <p className="text-xs text-muted-foreground">Libero</p>
      </div>
      <div className="bg-card rounded-xl border p-4 text-center">
        <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto mb-1.5" />
        <p className="text-lg font-bold">{highPriority}</p>
        <p className="text-xs text-muted-foreground">Priorità alta</p>
      </div>
    </div>
  );
}
