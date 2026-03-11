import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { getCategoryColors } from '../calendar/CategoryBadge';
import { motion } from 'framer-motion';

export default function CategoryCard({ category, onEdit, onDelete }) {
  const colors = getCategoryColors(category.color);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative rounded-xl border ${colors.border} ${colors.bg} p-5 transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${colors.dot}`} />
          <h3 className={`font-semibold ${colors.text}`}>{category.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(category)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
