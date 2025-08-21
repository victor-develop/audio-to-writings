Now we have to develop the UX controls to allow users send the audio to GEMINI with predefined prompts and get their generated text back (stored in supabase too.)

Create a folder here for me to store predefined prompts following certain formats. (you define, make it simple, like Name, Short Description, Prompts)

I will add prompt files into the repo and you are goona show the option to let users select the one.
 
When they make the UX interaction to convert, call GEMINI to do this in edge functions. Here's a reference snippet on how to call gemini with local files, for your reference (and you need to write one that works on edge functions):

```
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Please set the GEMINI_API_KEY environment variable.');
  process.exit(1);
}

if (process.argv.length < 3) {
  console.error('Usage: node index.js <audio_file_path>');
  process.exit(1);
}

const filePath = process.argv[2];
let audioBytes;
try {
  audioBytes = fs.readFileSync(filePath);
} catch (err) {
  console.error('Error reading audio file:', err.message);
  process.exit(1);
}

const prompt = `請將我上傳的錄音檔，轉錄成文字稿\n- 辨識錄音中的每位說話者並標記為「說話者 A」、「說話者 B」等。\n- 將每位說話者的對話內容轉錄為逐字稿，並在每段對話前加上時間戳。\n以下是輸出格式範例：\n[00:01] 說話者A：你好，今天我們討論的是人工智慧的發展。\n[00:05] 說話者B：是的，我認為這是一個非常有趣的主題。`;

async function transcribe() {
  // Gemini API endpoint for multimodal (v1beta)
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

  // Prepare request body
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: 'audio/mp3',
              data: audioBytes.toString('base64'),
            }
          },
          {
            text: prompt
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      console.log(response.data.candidates[0].content.parts[0].text);
    } else {
      console.error('No transcription result returned.');
    }
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

transcribe();

```

Guide me where to set my GEMINI api key too please. And design the necessary UX following current styling.
