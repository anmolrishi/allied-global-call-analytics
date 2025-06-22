import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  performanceDistribution: {
    rating: string;
    count: number;
  }[];
  commonIssues: {
    category: string;
    count: number;
  }[];
  performanceTrend: {
    date: string;
    score: number;
  }[];
  totalCalls: number;
  averageScore: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#64748b'];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select(`
          performance_score,
          rating,
          created_at,
          issues (
            category
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process performance distribution
      const ratingCounts: Record<string, number> = {};
      analyses.forEach(analysis => {
        ratingCounts[analysis.rating] = (ratingCounts[analysis.rating] || 0) + 1;
      });

      const performanceDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating,
        count,
      }));

      // Process common issues
      const issueCounts: Record<string, number> = {};
      analyses.forEach(analysis => {
        analysis.issues?.forEach(issue => {
          issueCounts[issue.category] = (issueCounts[issue.category] || 0) + 1;
        });
      });

      const commonIssues = Object.entries(issueCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Process performance trend
      const performanceTrend = analyses.map(analysis => ({
        date: new Date(analysis.created_at).toLocaleDateString(),
        score: analysis.performance_score,
      }));

      // Calculate averages
      const totalCalls = analyses.length;
      const averageScore = analyses.reduce((sum, analysis) => sum + analysis.performance_score, 0) / totalCalls;

      setData({
        performanceDistribution,
        commonIssues,
        performanceTrend,
        totalCalls,
        averageScore,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Calls</h3>
          <p className="text-3xl font-bold text-blue-600">{data.totalCalls}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Average Score</h3>
          <p className="text-3xl font-bold text-green-600">
            {data.averageScore.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Performance Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performance Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.performanceDistribution}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Common Issues
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.commonIssues}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performance Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}