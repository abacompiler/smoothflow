import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { getSmartSuggestions } from '@/services/suggestions';

export default function SmartSuggestion({ activities, categories, selectedDate, onAddSuggested }) {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    const nextSuggestions = await getSmartSuggestions({
      activities,
      categories,
      selectedDate,
      prompt
    });

    setSuggestions(nextSuggestions);
    setLoading(false);
  };

  const handleAcceptSuggestion = (suggestion) => {
    const category = categories.find(c => c.name.toLowerCase() === suggestion.category_name?.toLowerCase());
    onAddSuggested({
      title: suggestion.title,
      description: suggestion.description,
      date: selectedDate,
      start_time: suggestion.start_time,
      end_time: suggestion.end_time,
      category_id: category?.id || '',
      priority: suggestion.priority || 'medium',
      reminder_minutes: 15,
      is_suggested: true
    });
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  return (
    <Card className="p-5 border-primary/20 bg-accent/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">Suggerimento AI</h3>
      </div>
      
      <Textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Descrivi cosa devi fare oggi, e l'AI ti suggerirà come organizzare il tempo..."
        className="h-20 resize-none mb-3 bg-card text-sm"
      />
      
      <Button onClick={handleSuggest} disabled={loading || !prompt.trim()} size="sm" className="w-full">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        {loading ? 'Analizzando...' : 'Ottieni Suggerimenti'}
      </Button>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">Suggerimenti:</p>
            {suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between gap-3 p-3 bg-card rounded-lg border"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.start_time} - {s.end_time}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => handleAcceptSuggestion(s)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
