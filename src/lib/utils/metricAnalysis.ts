import { MetricAnalysis } from '@/lib/api/types';

export interface MetricStats {
  metricTitle: string;
  averageScore: number;
  equalToAverage: number;
  partiallyEqual: number;
  notMeeting: number;
  totalCalls: number;
}

export function processMetricAnalysis(analyses: { metric_analysis: string | null }[]): MetricStats[] {
  // Create a map to store scores for each metric
  const metricScoresMap: Record<string, number[]> = {};

  // Process each analysis and collect scores
  analyses.forEach(analysis => {
    if (!analysis.metric_analysis) return;

    try {
      const metrics: MetricAnalysis[] = JSON.parse(analysis.metric_analysis);
metrics.forEach(metric => {
  // Convert metric title to lowercase for case-insensitive comparison
  const normalizedTitle = metric.metric_title.toLowerCase();
  if (!metricScoresMap[normalizedTitle]) {
    metricScoresMap[normalizedTitle] = {
      title: metric.metric_title, // Keep original title for display
      scores: []
    };
  }
  metricScoresMap[normalizedTitle].scores.push(metric.score);
});
    } catch (error) {
      console.error('Error parsing metric analysis:', error);
    }
  });

  // Calculate statistics for each metric
return Object.entries(metricScoresMap).map(([normalizedTitle, data]) => {
  const totalCalls = data.scores.length;
  const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / totalCalls;
  const roundedAverage = Math.round(averageScore);

  // Count calls in each category
  const equalToAverage = data.scores.filter(score => score === roundedAverage).length;
  const partiallyEqual = data.scores.filter(score => 
    Math.abs(score - roundedAverage) === 1
  ).length;
  const notMeeting = data.scores.filter(score => 
    Math.abs(score - roundedAverage) > 1
  ).length;

  return {
    metricTitle: data.title, // Use original title for display
    averageScore,
    equalToAverage,
    partiallyEqual,
    notMeeting,
    totalCalls
  };
});
}