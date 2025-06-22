// import { supabase } from '../supabase';
// import { transcribeAudio, analyzeTranscription, type CallAnalysis } from './openai';

// export async function processCall(
//   callId: string,
//   audioFile: File,
//   onProgress?: (status: string) => void
// ): Promise<void> {
//   try {
//     // Update call status to transcribing
//     onProgress?.('Starting transcription');
//     await updateCallStatus(callId, 'transcribing');

//     // Transcribe audio
//     const transcription = await transcribeAudio(audioFile, onProgress);
//     await saveTranscription(callId, transcription);

//     // Update call status to analyzing
//     onProgress?.('Starting analysis');
//     await updateCallStatus(callId, 'analyzing');

//     // Analyze transcription
//     const analysis = await analyzeTranscription(transcription, onProgress);
//     await saveAnalysis(callId, analysis);

//     // Update call status to completed
//     onProgress?.('Processing completed');
//     await updateCallStatus(callId, 'completed');
//   } catch (error) {
//     console.error('Call processing error:', error);
//     await updateCallStatus(callId, 'failed');
//     throw error;
//   }
// }

// async function updateCallStatus(callId: string, status: string): Promise<void> {
//   const { error } = await supabase
//     .from('calls')
//     .update({ status, processing_details: status })
//     .eq('id', callId);

//   if (error) throw error;
// }

// async function saveTranscription(callId: string, content: string): Promise<void> {
//   const { error } = await supabase
//     .from('transcriptions')
//     .insert({
//       call_id: callId,
//       content,
//       language: 'es',
//       confidence: 0.95
//     });

//   if (error) throw error;
// }

// async function saveAnalysis(callId: string, analysis: CallAnalysis): Promise<void> {
//   const { data: analysisRecord, error: analysisError } = await supabase
//     .from('analyses')
//     .insert({
//       call_id: callId,
//       performance_score: analysis.performance_score,
//       rating: analysis.rating,
//       summary: analysis.summary
//     })
//     .select()
//     .single();

//   if (analysisError || !analysisRecord) throw analysisError;

//   if (analysis.issues?.length > 0) {
//     const { error: issuesError } = await supabase
//       .from('issues')
//       .insert(
//         analysis.issues.map(issue => ({
//           analysis_id: analysisRecord.id,
//           category: issue.category,
//           description: issue.description,
//           severity: issue.severity
//         }))
//       );

//     if (issuesError) throw issuesError;
//   }

//   if (analysis.recommendations?.length > 0) {
//     const { error: recsError } = await supabase
//       .from('recommendations')
//       .insert(
//         analysis.recommendations.map(rec => ({
//           analysis_id: analysisRecord.id,
//           content: rec.content,
//           priority: rec.priority
//         }))
//       );

//     if (recsError) throw recsError;
//   }
// }