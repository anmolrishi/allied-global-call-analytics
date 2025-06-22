import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from "@deepgram/sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Transcription endpoint
app.post('/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'Audio URL is required' });
    }

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      {
        url: audioUrl
      },
      {
        model: "nova-2",
        smart_format: true,
        detect_language: true,
        diarize: true,
      }
    );

    if (error) throw error;
    res.json({ transcript: result });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});