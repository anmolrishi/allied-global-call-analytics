import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MetricStats } from '@/lib/utils/metricAnalysis';

interface MetricAnalysisChartsProps {
  metrics: MetricStats[];
}

export default function MetricAnalysisCharts({ metrics }: MetricAnalysisChartsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Metric Performance Distribution</h3>
      <div className="grid grid-cols-1 gap-6">
        {metrics.map((metric) => (
          <div key={metric.metricTitle} className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{metric.metricTitle}</h4>
                <p className="text-sm text-gray-500">
                  Average Score: {metric.averageScore.toFixed(1)} | Total Calls: {metric.totalCalls}
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      category: 'Meeting Average',
                      value: metric.equalToAverage,
                      fill: '#22c55e'
                    },
                    {
                      category: 'Partially Meeting',
                      value: metric.partiallyEqual,
                      fill: '#eab308'
                    },
                    {
                      category: 'Not Meeting',
                      value: metric.notMeeting,
                      fill: '#ef4444'
                    }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2" />
                <span>Meeting Average ({metric.equalToAverage})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2" />
                <span>Partially Meeting ({metric.partiallyEqual})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2" />
                <span>Not Meeting ({metric.notMeeting})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}