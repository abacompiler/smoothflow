import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CategoryCard from '../components/categories/CategoryCard';
import AddCategoryDialog from '../components/categories/AddCategoryDialog';
import { motion } from 'framer-motion';

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
      setEditingCategory(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const handleSave = (data) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categorie</h1>
            <p className="text-muted-foreground mt-1">Gestisci le tue categorie personalizzate</p>
          </div>
          <Button size="sm" onClick={() => { setEditingCategory(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nuova
          </Button>
        </motion.div>

        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Nessuna categoria</p>
            <p className="text-sm text-muted-foreground mt-1">Crea le tue categorie per organizzare le attività</p>
            <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
              Crea Prima Categoria
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={(c) => deleteMutation.mutate(c.id)}
              />
            ))}
          </div>
        )}

        <AddCategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          editingCategory={editingCategory}
        />
      </div>
    </div>
  );
}
