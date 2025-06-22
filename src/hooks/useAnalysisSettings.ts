import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AnalysisMetric {
  id: string;
  title: string;
  description: string;
}

interface AnalysisSettingsState {
  criteria: AnalysisMetric[];
  loading: boolean;
  fetchCriteria: () => Promise<void>;
}

export const useAnalysisSettings = create<AnalysisSettingsState>((set) => ({
  criteria: [],
  loading: true,
  fetchCriteria: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('analysis_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ criteria: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching analysis criteria:', error);
      set({ loading: false });
    }
  },
}));