
# Audio and Video Processing with Google Cloud Speech-to-Text and ffmpeg

This project preprocesses audio, uploads it to Google Cloud Storage, transcribes it using Google Cloud Speech-to-Text, generates SRT subtitles, and adds these subtitles to a video file.

## Prerequisites

1. Node.js installed on your machine.
2. Google Cloud account and project set up.
3. `ffmpeg` installed on your machine.
4. Environment variables configured in a `.env` file.

## Environment Variables

Create a `.env` file in the root directory of your project and add the following variables:

```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path-to-your-service-account-json-file
GOOGLE_CLOUD_STORAGE_BUCKET_NAME=your-bucket-name
```

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-repo.git
    cd your-repo
    ```

2. Install the necessary dependencies:
    ```bash
    npm install
    ```

## Usage

Run the script with the following command:
```bash
node index.js
```

The script performs the following steps:

1. **Preprocess Audio**: Converts and preprocesses the audio file (`audio.mp4`) to remove noise and normalize levels, saving it as `audio.mp3`.

2. **Upload Audio**: Uploads the preprocessed audio file (`audio.mp3`) to Google Cloud Storage.

3. **Transcribe Audio**: Transcribes the audio file using Google Cloud Speech-to-Text and generates an SRT file (`subtitles.srt`) with word-level timestamps.

4. **Add Subtitles to Video**: Adds the generated subtitles to the original video file (`audio.mp4`), producing an output video file (`output_video_with_audio.mp4`).

## Functions

### preprocessAudio(inputFilePath, outputFilePath)
Preprocesses the input audio file and converts it to MP3 format.
- **inputFilePath**: Path to the input audio file (e.g., `audio.mp4`).
- **outputFilePath**: Path to the output MP3 file (e.g., `audio.mp3`).

### uploadFile()
Uploads the preprocessed audio file (`audio.mp3`) to Google Cloud Storage.

### transcribeAudio()
Transcribes the audio file stored in Google Cloud Storage and generates an SRT file (`subtitles.srt`) with subtitles.

### addSubtitlesToVideo(inputVideo, subtitlesFile, outputVideo)
Adds subtitles to the video file.
- **inputVideo**: Path to the input video file (e.g., `audio.mp4`).
- **subtitlesFile**: Path to the SRT subtitles file (e.g., `subtitles.srt`).
- **outputVideo**: Path to the output video file (e.g., `output_video_with_audio.mp4`).

## Error Handling

Errors encountered during each step are logged to the console.

## License

This project is licensed under the MIT License.

---

Feel free to customize this README as per your project needs!
