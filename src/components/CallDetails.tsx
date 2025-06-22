import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/Button';
import { X, Globe } from 'lucide-react';
import { fetchCallDetails } from '@/lib/api/database';
import { processCall } from '@/lib/api/processing';
import { toast } from 'react-hot-toast';
import type {
  CallDetails as CallDetailsType,
  MetricAnalysis,
} from '@/lib/api/types';

interface CallDetailsProps {
  callId: string;
  onClose: () => void;
}

export default function CallDetails({ callId, onClose }: CallDetailsProps) {
  const [call, setCall] = useState<CallDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    const loadCallDetails = async () => {
      try {
        const data = await fetchCallDetails(callId);
        console.log(data);
        setCall(data);
      } catch (error) {
        console.error('Error fetching call details:', error);
        toast.error('Failed to load call details');
      } finally {
        setLoading(false);
      }
    };

    loadCallDetails();

    // Subscribe to changes
    const channel = supabase
      .channel(`call-${callId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callId}`,
        },
        loadCallDetails
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId]);

  const handleProcess = async () => {
    if (!call) return;

    setProcessing(true);
    const toastId = toast.loading('Downloading audio file...');

    try {
      const { data } = await supabase.storage
        .from('call-recordings')
        .download(call.file_path);

      if (!data) {
        throw new Error('Failed to download audio file');
      }

      const file = new File([data], call.file_path, {
        type: 'audio/mpeg',
      });

      await processCall(callId, file, (status) => {
        toast.loading(status, { id: toastId });
      });

      toast.success('Call processed successfully', { id: toastId });
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process call', { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const renderMetricAnalysis = (metricAnalysisStr: string | undefined) => {
    console.log(metricAnalysisStr);
    if (!metricAnalysisStr) return null;

    try {
      const metricAnalysis: MetricAnalysis[] = JSON.parse(metricAnalysisStr);

      return (
        <div className="space-y-4">
          {metricAnalysis.map((metric, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">
                  {metric.metric_title}
                </h4>
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Score: {metric.score}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  {metric.analysis}
                </p>

                {metric.examples.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      Examples:
                    </h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {metric.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {metric.strengths.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      Strengths:
                    </h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {metric.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {metric.areas_for_improvement.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      Areas for Improvement:
                    </h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {metric.areas_for_improvement.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error parsing metric analysis:', error);
      return null;
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

  if (!call) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b gap-4">
          <h2 className="text-xl font-semibold">Call Details</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(lang => lang === 'en' ? 'es' : 'en')}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'English' : 'Español'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Status</h3>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    call.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : call.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {call.status}
                </span>
                {call.processing_details && (
                  <span className="text-sm text-gray-500">
                    {call.processing_details}
                  </span>
                )}
              </div>
            </div>

            {!call.transcriptions?.[0]?.content &&
              call.status !== 'transcribing' &&
              call.status !== 'analyzing' && (
                <div>
                  <Button
                    onClick={handleProcess}
                    isLoading={processing}
                    disabled={processing}
                  >
                    Start Processing
                  </Button>
                </div>
              )}

            {call.transcriptions?.[0]?.content && (
              <div>
                <h3 className="text-lg font-medium mb-2">Transcription</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {call.transcriptions[0].content}
                  </p>
                </div>
              </div>
            )}

            {call.analyses?.[0] && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-2">Analysis</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-sm text-gray-500">Score</span>
                        <p className="text-2xl font-semibold">
                          {call.analyses[0].performance_score}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Rating</span>
                        <p className="text-lg font-medium capitalize">
                          {call.analyses[0].rating}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Detailed Analysis
                      </span>
                      <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans">
                        {language === 'en' ? call.analyses[0].summary : call.analyses[0].summary_spanish}
                      </pre>
                    </div>
                  </div>
                </div>

                {call.analyses[0].metric_analysis && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Metric Analysis
                    </h3>
                    {renderMetricAnalysis(language === 'en' ? call.analyses[0].metric_analysis : call.analyses[0].metric_analysis_spanish)}
                  </div>
                )}

                {call.analyses[0].issues?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Issues</h3>
                    <div className="space-y-2">
                      {call.analyses[0].issues.map((issue, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-900">
                              {language === 'en' ? issue.category : issue.category_spanish}
                            </h4>
                            <span className="text-sm text-gray-500">
                              Severity: {issue.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {language === 'en' ? issue.description : issue.description_spanish}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {call.analyses[0].recommendations?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Recommendations
                    </h3>
                    <div className="space-y-2">
                      {call.analyses[0].recommendations.map((rec, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-gray-700">
                              {language === 'en' ? rec.content : rec.content_spanish}
                            </p>
                            <span className="text-sm text-gray-500 ml-2">
                              Priority: {rec.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}