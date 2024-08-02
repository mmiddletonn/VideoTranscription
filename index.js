const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const speech = require('@google-cloud/speech');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;
const mp4FileName = 'audio.mp4';
const mp3FileName = 'audio.mp3';
const gcsUri = `gs://${bucketName}/${path.basename(mp3FileName)}`;
const srtFileName = 'subtitles.srt';
const outputVideoFileName = 'output_video_with_audio.mp4';

async function preprocessAudio(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .audioFilters([
        'highpass=f=300', // Remove low-frequency noise
        'lowpass=f=3000', // Remove high-frequency noise
        'afftdn=nf=-25', // Apply noise reduction
        'equalizer=f=1000:width_type=h:width=200:g=10', // Boost mid frequencies (typical vocal range)
        'dynaudnorm' // Normalize audio levels
      ])
      .toFormat('mp3')
      .on('end', () => {
        console.log('Audio preprocessing and conversion to MP3 completed');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error during audio preprocessing', err);
        reject(err);
      })
      .save(outputFilePath);
  });
}


async function uploadFile() {
  const storage = new Storage({ projectId, keyFilename });
  await storage.bucket(bucketName).upload(mp3FileName, {
    destination: path.basename(mp3FileName),
  });
  console.log(`${mp3FileName} uploaded to ${bucketName}`);
}

async function transcribeAudio() {
  const client = new speech.SpeechClient({ projectId, keyFilename });

  const audio = {
    uri: gcsUri,
  };

  const config = {
    encoding: 'MP3',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
    enableWordTimeOffsets: true, // Request word-level timestamps
  };

  const request = {
    audio: audio,
    config: config,
  };

  const [operation] = await client.longRunningRecognize(request);
  const [response] = await operation.promise();

  const segments = [];
  let currentSegment = { transcript: '', startTime: '0.0', endTime: '5.0' };
  let currentStartTime = 0.0;
  const maxSegmentDuration = 5.0;

  response.results.forEach(result => {
    const words = result.alternatives[0].words;
    words.forEach(word => {
      const wordStartTime = parseFloat(`${word.startTime.seconds}.${word.startTime.nanos}`);
      const wordEndTime = parseFloat(`${word.endTime.seconds}.${word.endTime.nanos}`);

      if (wordStartTime >= currentStartTime + maxSegmentDuration) {
        segments.push(currentSegment);
        currentStartTime += maxSegmentDuration;
        currentSegment = {
          transcript: word.word,
          startTime: currentStartTime.toFixed(1),
          endTime: (currentStartTime + maxSegmentDuration).toFixed(1),
        };
      } else {
        currentSegment.transcript += ` ${word.word}`;
        currentSegment.endTime = wordEndTime.toFixed(1);
      }
    });
  });

  segments.push(currentSegment); // Push the last segment

  const srtContent = segments.map((segment, index) => {
    const start = new Date(segment.startTime * 1000).toISOString().substr(11, 12).replace('.', ',');
    const end = new Date(segment.endTime * 1000).toISOString().substr(11, 12).replace('.', ',');
    return `${index + 1}\n${start} --> ${end}\n${segment.transcript}\n`;
  }).join('\n');

  fs.writeFileSync(srtFileName, srtContent);
  console.log('SRT file saved to subtitles.srt');
}

async function addSubtitlesToVideo(inputVideo, subtitlesFile, outputVideo) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputVideo)
      .outputOptions('-vf', `subtitles=${subtitlesFile}:force_style='Alignment=2,FontSize=24'`)
      .on('end', () => {
        console.log('Subtitles added to video');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error during video processing', err);
        reject(err);
      })
      .save(outputVideo);
  });
}

(async () => {
  try {
    await preprocessAudio(mp4FileName, mp3FileName);
    await uploadFile();
    await transcribeAudio();
    await addSubtitlesToVideo(mp4FileName, srtFileName, outputVideoFileName);
  } catch (error) {
    console.error('Error:', error);
  }
})();
