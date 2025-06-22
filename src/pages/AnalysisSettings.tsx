import { useState, useEffect } from 'react';
import { X, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface AnalysisMetric {
  id: string;
  title: string;
  description: string;
  created_at: string;
  edited_at: string;
}

export default function AnalysisSettings() {
  const [metrics, setMetrics] = useState<AnalysisMetric[]>([]);
  const [newMetric, setNewMetric] = useState({ title: '', description: '' });
  const [editingMetric, setEditingMetric] = useState<AnalysisMetric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('analysis_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = async () => {
    if (!newMetric.title || !newMetric.description) {
      toast.error('Please fill in both title and description');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('analysis_metrics')
        .insert({
          user_id: user.id,
          title: newMetric.title,
          description: newMetric.description,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Metric added successfully');
      setNewMetric({ title: '', description: '' });
      setMetrics(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding metric:', error);
      toast.error('Failed to add metric');
    }
  };

  const handleEditMetric = async () => {
    if (!editingMetric || !editingMetric.title || !editingMetric.description) {
      toast.error('Please fill in both title and description');
      return;
    }

    try {
      const { error } = await supabase
        .from('analysis_metrics')
        .update({
          title: editingMetric.title,
          description: editingMetric.description,
        })
        .eq('id', editingMetric.id);

      if (error) throw error;

      // Fetch the updated record to get the new edited_at timestamp
      const { data: updatedMetric, error: fetchError } = await supabase
        .from('analysis_metrics')
        .select('*')
        .eq('id', editingMetric.id)
        .single();

      if (fetchError) throw fetchError;

      toast.success('Metric updated successfully');
      setMetrics(prev => prev.map(metric => 
        metric.id === editingMetric.id ? updatedMetric : metric
      ));
      setEditingMetric(null);
    } catch (error) {
      console.error('Error updating metric:', error);
      toast.error('Failed to update metric');
    }
  };

  const handleDeleteMetric = async (id: string) => {
    try {
      const { error } = await supabase
        .from('analysis_metrics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Metric deleted successfully');
      setMetrics(prev => prev.filter(metric => metric.id !== id));
    } catch (error) {
      console.error('Error deleting metric:', error);
      toast.error('Failed to delete metric');
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy HH:mm:ss');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Settings</h2>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Add New Metric</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newMetric.title}
                  onChange={(e) =>
                    setNewMetric((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Customer Greeting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newMetric.description}
                  onChange={(e) =>
                    setNewMetric((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="e.g., Evaluate how well the agent greets the customer and establishes rapport"
                />
              </div>
              <Button onClick={handleAddMetric} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Current Metrics</h3>
            {metrics.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No metrics added yet. Add some metrics above to customize your call
                analysis.
              </p>
            ) : (
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="bg-gray-50 p-4 rounded-lg relative group"
                  >
                    {editingMetric?.id === metric.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingMetric.title}
                          onChange={(e) =>
                            setEditingMetric((prev) => ({
                              ...prev!,
                              title: e.target.value,
                            }))
                          }
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <textarea
                          value={editingMetric.description}
                          onChange={(e) =>
                            setEditingMetric((prev) => ({
                              ...prev!,
                              description: e.target.value,
                            }))
                          }
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMetric(null)}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleEditMetric}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMetric(metric)}
                          >
                            <Edit2 className="h-4 w-4 text-gray-500 hover:text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMetric(metric.id)}
                          >
                            <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-gray-900">{metric.title}</h4>
                        <p className="text-gray-600 mt-1">{metric.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <p>Created: {formatDate(metric.created_at)}</p>
                          <p>Last edited: {formatDate(metric.edited_at)}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}