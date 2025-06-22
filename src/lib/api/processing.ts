import { supabase } from '../supabase';
import { analyzeTranscription } from './openai';
import { updateCallStatus, saveTranscription, saveAnalysis } from './database';

const BACKEND_URL = 'https://allied-backend-edsplore.replit.app';

export async function processCall(
  callId: string,
  filePath: string,
  onProgress?: (status: string) => void
): Promise<void> {
  try {
    // Update call status to transcribing
    onProgress?.('Starting transcription');
    await updateCallStatus(callId, 'transcribing');

    // Get signed URL from Supabase
    const { data } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(filePath, 300); // 5 minutes expiry

    if (!data?.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

    // Send signed URL to backend for transcription
    const response = await fetch(`${BACKEND_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl: data.signedUrl }),
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const { transcript } = await response.json();

    // Save transcription from Deepgram response
    await saveTranscription(
      callId,
      transcript.results.channels[0].alternatives[0].paragraphs.transcript
    );

    // Update call status to analyzing
    onProgress?.('Starting analysis');
    await updateCallStatus(callId, 'analyzing');

    // Analyze transcription
    const analysis = await analyzeTranscription(transcript.results.channels[0].alternatives[0].paragraphs.transcript, onProgress);
    await saveAnalysis(callId, analysis);

    // Update call status to completed
    onProgress?.('Processing completed');
    await updateCallStatus(callId, 'completed');
  } catch (error) {
    console.error('Call processing error:', error);
    await updateCallStatus(callId, 'failed');
    throw error;
  }
}
