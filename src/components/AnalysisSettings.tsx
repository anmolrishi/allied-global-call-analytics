import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface AnalysisMetric {
  id: string;
  title: string;
  description: string;
}

interface AnalysisSettingsProps {
  onClose: () => void;
}

export default function AnalysisSettings({ onClose }: AnalysisSettingsProps) {
  const [metrics, setMetrics] = useState<AnalysisMetric[]>([]);
  const [newMetric, setNewMetric] = useState({ title: '', description: '' });
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Analysis Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMetric(metric.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                    </Button>
                    <h4 className="font-medium text-gray-900">{metric.title}</h4>
                    <p className="text-gray-600 mt-1">{metric.description}</p>
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