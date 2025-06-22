export interface MetricAnalysis {
  metric_title: string;
  score: number;
  analysis: string;
  analysis_spanish: string;
  examples: string[];
  examples_spanish: string[];
  strengths: string[];
  strengths_spanish: string[];
  areas_for_improvement: string[];
  areas_for_improvement_spanish: string[];
}

export interface CallAnalysis {
  performance_score: number;
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'unacceptable';
  summary: string;
  summary_spanish: string;
  issues: Array<{
    category: string;
    category_spanish: string;
    description: string;
    description_spanish: string;
    severity: number;
  }>;
  recommendations: Array<{
    content: string;
    content_spanish: string;
    priority: number;
  }>;
  metric_analysis?: MetricAnalysis[];
  metric_analysis_spanish?: MetricAnalysis[];
}

export interface CallDetails {
  id: string;
  status: string;
  processing_details: string;
  call_date: string;
  file_path: string;
  transcriptions?: Array<{
    content: string;
  }>;
  analyses?: Array<{
    performance_score: number;
    rating: string;
    summary: string;
    summary_spanish: string;
    metric_analysis?: string;
    metric_analysis_spanish?: string;
    issues: Array<{
      category: string;
      category_spanish: string;
      description: string;
      description_spanish: string;
      severity: number;
    }>;
    recommendations: Array<{
      content: string;
      content_spanish: string;
      priority: number;
    }>;
  }>;
}