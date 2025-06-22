import { supabase } from '../supabase';
import type { CallDetails } from './types';

export async function updateCallStatus(
  callId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('calls')
    .update({ status, processing_details: status })
    .eq('id', callId);

  if (error) throw error;
}

export async function saveTranscription(
  callId: string,
  content: string
): Promise<void> {
  const { error } = await supabase.from('transcriptions').insert({
    call_id: callId,
    content,
    language: 'en',
    confidence: 0.95,
  });

  if (error) throw error;
}

export function getStorageUrl(filePath: string): string {
  return `${
    supabase.storage.from('call-recordings').getPublicUrl(filePath).data
      .publicUrl
  }`;
}

export async function getCallStatus(callId: string): Promise<string> {
  const { data, error } = await supabase
    .from('calls')
    .select('status')
    .eq('id', callId)
    .single();

  if (error) throw error;
  return data.status;
}

export async function saveAnalysis(
  callId: string,
  analysis: CallAnalysis
): Promise<void> {
  const { data: analysisRecord, error: analysisError } = await supabase
    .from('analyses')
    .insert({
      call_id: callId,
      performance_score: analysis.performance_score,
      rating: analysis.rating,
      summary: analysis.summary,
      summary_spanish: analysis.summary_spanish,
      metric_analysis: analysis.metric_analysis
        ? JSON.stringify(analysis.metric_analysis)
        : null,
      metric_analysis_spanish: analysis.metric_analysis_spanish  // Use the Spanish version directly
        ? JSON.stringify(analysis.metric_analysis_spanish)
        : null,
    })
    .select()
    .single();

  if (analysisError || !analysisRecord) throw analysisError;

  if (analysis.issues?.length > 0) {
    const { error: issuesError } = await supabase.from('issues').insert(
      analysis.issues.map((issue) => ({
        analysis_id: analysisRecord.id,
        category: issue.category,
        category_spanish: issue.category_spanish,
        description: issue.description,
        description_spanish: issue.description_spanish,
        severity: issue.severity,
      }))
    );

    if (issuesError) throw issuesError;
  }

  if (analysis.recommendations?.length > 0) {
    const { error: recsError } = await supabase.from('recommendations').insert(
      analysis.recommendations.map((rec) => ({
        analysis_id: analysisRecord.id,
        content: rec.content,
        content_spanish: rec.content_spanish,
        priority: rec.priority,
      }))
    );

    if (recsError) throw recsError;
  }
}

export async function fetchCallDetails(
  callId: string
): Promise<CallDetails | null> {
  const { data, error } = await supabase
    .from('calls')
    .select(
      `
      id,
      status,
      processing_details,
      call_date,
      file_path,
      transcriptions (
        content
      ),
      analyses (
        performance_score,
        rating,
        summary,
        summary_spanish,
        metric_analysis,
        metric_analysis_spanish,
        issues (
          category,
          category_spanish,
          description,
          description_spanish,
          severity
        ),
        recommendations (
          content,
          content_spanish,
          priority
        )
      )
    `
    )
    .eq('id', callId)
    .single();

  if (error) throw error;
  return data;
}