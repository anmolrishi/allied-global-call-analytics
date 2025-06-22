import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { Phone, TrendingUp } from 'lucide-react';
import { processMetricAnalysis } from '@/lib/utils/metricAnalysis';
import MetricAnalysisCharts from '@/components/MetricAnalysisCharts';
import type { MetricStats } from '@/lib/utils/metricAnalysis';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#64748b'];

interface DashboardStats {
  totalCalls: number;
  avgPerformance: number;
  commonIssues: Array<{
    name: string;
    count: number;
  }>;
  performanceDistribution: Array<{
    rating: string;
    count: number;
  }>;
  metricStats: MetricStats[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    avgPerformance: 0,
    commonIssues: [],
    performanceDistribution: [],
    metricStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        fetchDashboardData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select(`
          performance_score,
          rating,
          created_at,
          metric_analysis,
          issues (
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;

      // Calculate total calls and average performance
      const totalCalls = analyses?.length || 0;
      const avgPerformance = analyses?.length
        ? analyses.reduce((sum, a) => sum + a.performance_score, 0) / totalCalls
        : 0;

      // Process common issues
      const issueMap = new Map<string, number>();
      analyses?.forEach(analysis => {
        analysis.issues?.forEach(issue => {
          issueMap.set(
            issue.category,
            (issueMap.get(issue.category) || 0) + 1
          );
        });
      });

      const commonIssues = Array.from(issueMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Process performance distribution
      const ratingMap = new Map<string, number>();
      analyses?.forEach(analysis => {
        ratingMap.set(
          analysis.rating,
          (ratingMap.get(analysis.rating) || 0) + 1
        );
      });

      const performanceDistribution = Array.from(ratingMap.entries())
        .map(([rating, count]) => ({ rating, count }));

      // Process metric analysis
      const metricStats = processMetricAnalysis(analyses || []);

      setStats({
        totalCalls,
        avgPerformance,
        commonIssues,
        performanceDistribution,
        metricStats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-blue-500 p-3">
                  <Phone className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Calls Processed
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.totalCalls}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Performance Score
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.avgPerformance.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performance Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.performanceDistribution}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Common Issues Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.commonIssues}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {stats.metricStats.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <MetricAnalysisCharts metrics={stats.metricStats} />
        </div>
      )}
    </div>
  );
}