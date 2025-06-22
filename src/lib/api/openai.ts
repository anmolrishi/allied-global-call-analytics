import axios from 'axios';
import { supabase } from '../supabase';

const AZURE_OPENAI_URL =
  'https://opi-ia-apps-v3.openai.azure.com/openai/deployments/OPI-IA-APPS-gpt-4o/chat/completions?api-version=2024-08-01-preview';
const AZURE_API_KEY =
  '2lJLhnInlkaI8uYlxv6eAwkIG96IS36BWLnUUGnAT3ymAxgoyZg9JQQJ99BBACHYHv6XJ3w3AAABACOGKGNc';

async function fetchAnalysisMetrics() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('analysis_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching analysis metrics:', error);
    return [];
  }
}

export async function analyzeTranscription(
  transcription: string,
  onProgress?: (status: string) => void
): Promise<CallAnalysis> {
  try {
    onProgress?.('Analyzing transcription');

    // Get analysis metrics
    const metrics = await fetchAnalysisMetrics();

    const basePrompt = `You are an expert call center quality analyst. Analyze the following customer service call transcript and provide a comprehensive analysis. You must provide ALL responses in both English and Spanish, maintaining the same structure and meaning in both languages.

Your analysis should include:

1. Overall Performance Assessment:
   - Performance score (0-100)
   - Rating (excellent/good/average/poor/unacceptable)
   - Detailed analysis that includes:
     * Overall call evaluation

2. Key Issues:
   - Identify and categorize critical problems or areas of concern
   - Each issue should include:
     * Category (e.g., Communication, Process Knowledge, Customer Service)
     * Detailed description of the problem
     * Severity level (1-5, where 5 is most severe)

3. Actionable Recommendations:
   - Specific, practical suggestions for improvement
   - Each recommendation should include:
     * Detailed improvement action
     * Priority level (1-5, where 5 is highest priority)

4. Metric Analysis:
 - We need metric-wise analysis of all the metrics attached here. 
 - No metric should be repeated.
 - All given metrics should be returned 
 - Do not add any other metric by yourself. Only the given metrics should be added. 
 - The list of the metrics is given below :- 

${
  metrics.length > 0
    ? `* Analysis for each of these specific metrics:\n${metrics
        .map((m, i) => `       ${i + 1}. ${m.title}: ${m.description}`)
        .join('\n')}`
    : '* Analysis based on standard call center quality metrics'
}


IMPORTANT: You must provide ALL text content in both English and Spanish. The JSON structure below shows where each language version should go. Keep the following in mind:
- All text fields have both an English version and a Spanish version
- Keys remain in English
- Numeric values (scores, priorities, etc.) are the same for both languages
- Translate all text naturally and professionally, maintaining the meaning and tone
- Ensure Spanish translations are culturally appropriate and use proper call center terminology

Format your response as JSON with this structure:
{
  "performance_score": number (0-100),
  "rating": "excellent" | "good" | "average" | "poor" | "unacceptable",
  "summary": "English analysis summary",
  "summary_spanish": "Spanish analysis summary",
  "issues": [
    {
      "category": "English category",
      "category_spanish": "Spanish category",
      "description": "English description",
      "description_spanish": "Spanish description",
      "severity": number (1-5)
    }
  ],
  "recommendations": [
    {
      "content": "English recommendation",
      "content_spanish": "Spanish recommendation",
      "priority": number (1-5)
    }
  ],
  "metric_analysis": [  // English version
    {
      "metric_title": "string",
      "score": number (0-10),
      "analysis": "English analysis",
      "examples": ["English examples"],
      "strengths": ["English strengths"],
      "areas_for_improvement": ["English areas for improvement"]
    }
  ],
  "metric_analysis_spanish": [  // Spanish version
    {
      "metric_title": "string",
      "score": number (0-10),
      "analysis": "Spanish analysis",
      "examples": ["Spanish examples"],
      "strengths": ["Spanish strengths"],
      "areas_for_improvement": ["Spanish areas for improvement"]
    }
  ]
}`;

    const requestBody = {
      messages: [
        {
          role: 'system',
          content: basePrompt,
        },
        {
          role: 'user',
          content: transcription,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    };

    const headers = {
      'Content-Type': 'application/json',
      'api-key': AZURE_API_KEY,
    };

    try {
      const response = await axios.post(AZURE_OPENAI_URL, requestBody, {
        headers,
      });
      onProgress?.('Analysis completed');
      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Azure OpenAI API error:', error);
      if (error.response?.data) {
        console.error('Azure OpenAI API error response:', error.response.data);
      }
      throw new Error('Failed to analyze transcription');
    }
  } catch (error: any) {
    console.error('Analysis error:', error);
    throw new Error(error.message || 'Failed to analyze transcription');
  }
}

export interface CallAnalysis {
  performance_score: number;
  rating: 'excellent' | 'good' | 'average' | 'poor' | 'unacceptable';
  summary: string;
  issues: Array<{
    category: string;
    description: string;
    severity: number;
  }>;
  recommendations: Array<{
    content: string;
    priority: number;
  }>;
}
