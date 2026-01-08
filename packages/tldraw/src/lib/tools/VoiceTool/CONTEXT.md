# VoiceTool (WhisperDraw)

Voice transcription tool that records audio, transcribes via Gemini API, and creates Note shapes on the canvas.

## Overview

The VoiceTool allows users to speak and have their words transcribed into sticky notes on the canvas. It uses Google's Gemini API for transcription and supports multiple Gemini models for different quality/speed tradeoffs.

## Usage

1. **Activate**: Press `Shift+M` or click the microphone icon in the toolbar
2. **Configure** (first time): If no API key is set, the settings dialog opens automatically
3. **Record**: Click anywhere on the canvas to start recording
4. **Stop**: Click again or use the Stop button in the overlay to finish recording
5. **Result**: A yellow Note shape appears at the viewport center with the transcription

## Keyboard shortcut

- `Shift+M` - Activate voice tool

## State machine

```
VoiceTool
├── idle       → Click to start recording
├── recording  → Click to stop, Cancel to discard
└── processing → Automatic transition after recording
```

### States

**idle**
- Entry state when tool is selected
- Cursor: crosshair (indicates "click to record")
- On pointer down: transitions to `recording`
- On cancel (Escape): returns to select tool

**recording**
- Audio is being captured via MediaRecorder API
- Cursor: crosshair
- UI overlay shows: pulsing red dot, elapsed time, Stop/Cancel buttons
- On pointer down (toggle): stops recording, transitions to `processing`
- On Stop button click: same as above
- On Cancel button click / Escape: discards recording, returns to `idle`
- Minimum duration: 500ms (shorter recordings are discarded)

**processing**
- Audio is being sent to Gemini API for transcription
- Cursor: wait
- UI overlay shows: spinner with "Processing transcription..."
- On success: creates Note shape, shows success toast, returns to `idle`
- On error: shows error toast, returns to `idle`

## Components

### VoiceTool (`VoiceTool.ts`)
Main StateNode that registers the tool with the editor.

### Child states (`childStates/`)
- `Idle.ts` - Waiting for user to start recording
- `Recording.ts` - Capturing audio, listening for stop/cancel
- `Processing.ts` - Sending to API, creating shapes

### AudioRecorder (`audioRecorder.ts`)
Utility class wrapping MediaRecorder API with:
- Automatic format negotiation (WebM/Opus preferred)
- Audio enhancement (echo cancellation, noise suppression, auto gain)
- Clean start/stop/cancel lifecycle

### TranscriptionService (`transcriptionService.ts`)
Handles Gemini API communication:
- Converts audio blob to base64
- Sends multimodal request to Gemini
- Parses transcription response

### VoiceSettings (`voiceSettings.ts`)
LocalStorage-based settings for:
- `voice-api-key` - Gemini API key
- `voice-model` - Selected Gemini model

### VoiceSettingsDialog (`ui/components/VoiceSettingsDialog.tsx`)
Configuration UI for:
- API key input (masked by default)
- Model selection dropdown
- Link to get API key from Google AI Studio

### VoiceRecordingOverlay (`ui/components/VoiceRecordingOverlay.tsx`)
Floating UI overlay showing:
- Recording status with pulsing red dot
- Elapsed time counter
- Stop/Cancel buttons
- Processing spinner

## Gemini models supported

| Model | Description |
|-------|-------------|
| `gemini-2.5-flash` | Balanced speed and quality (recommended) |
| `gemini-2.5-flash-lite` | Fastest, lowest cost |
| `gemini-2.5-pro` | Highest quality |
| `gemini-2.0-flash` | Legacy stable version |

## Events

The tool communicates with the UI via editor events:

| Event | Direction | Description |
|-------|-----------|-------------|
| `voice-stop` | UI → Tool | Stop recording, process audio |
| `voice-cancel` | UI → Tool | Cancel recording, discard audio |
| `open-voice-settings` | Tool → UI | Open settings dialog |
| `show-toast` | Tool → UI | Show toast notification |

## Optional tool

VoiceTool is **not included by default** in tldraw. To enable it:

```tsx
import { Tldraw, VoiceTool, defaultTools } from 'tldraw'

// Include voice tool explicitly
<Tldraw tools={[...defaultTools, VoiceTool]} />

// Or use the optionalTools export
import { optionalTools } from 'tldraw'
<Tldraw tools={[...defaultTools, optionalTools.VoiceTool]} />
```

## Long recordings & chunking

Recordings over 45 seconds are automatically split into chunks:
- Each chunk is transcribed in parallel for faster processing
- User preference controls output format:
  - **Individual mode** (default): Creates separate sticky notes per chunk
  - **Merged mode**: Combines all text into one note

Configure via Voice Settings dialog or programmatically:
```typescript
import { setVoiceChunkMergeMode } from 'tldraw'
setVoiceChunkMergeMode('merged') // or 'individual'
```

## Types & interfaces

The tool exports interfaces for dependency injection and testing:

```typescript
// types.ts
interface IAudioRecorder {
  start(onChunk?: OnChunkCallback): Promise<void>
  stop(): Promise<AudioRecordingResult>
  cancel(): void
}

interface ITranscriptionService {
  transcribe(audioBlob: Blob, apiKey: string, model: string, signal?: AbortSignal): Promise<string>
}

type ChunkMergeMode = 'individual' | 'merged'
```

## Testing

### Running tests

```bash
cd packages/tldraw
yarn test run VoiceTool
```

### Test setup

VoiceTool tests require explicit registration (since it's optional):

```typescript
import { TestEditor } from '../../../test/TestEditor'
import { VoiceTool } from './VoiceTool'

beforeEach(() => {
  editor = new TestEditor({ tools: [VoiceTool] })
})
```

### Mock implementations

Mock classes are provided in `__mocks__/`:

```typescript
import { MockAudioRecorder, createMockAudioRecorder } from './__mocks__/audioRecorder'
import { MockTranscriptionService, createMockTranscriptionService } from './__mocks__/transcriptionService'

// Configure mock behavior
const recorder = createMockAudioRecorder()
recorder.startError = new Error('Permission denied')

const transcriber = createMockTranscriptionService()
transcriber.mockTranscription = 'Hello world'
transcriber.transcribeDelay = 1000 // Simulate network latency
```

### Testing chunking

```typescript
const recorder = createMockAudioRecorder()
recorder.setMockChunks([
  new Blob(['chunk1'], { type: 'audio/webm' }),
  new Blob(['chunk2'], { type: 'audio/webm' }),
  new Blob(['chunk3'], { type: 'audio/webm' }),
])

const transcriber = createMockTranscriptionService()
transcriber.queueTranscriptions('First segment', 'Second segment', 'Third segment')
```

## CSS classes

All overlay styles use the `tlui-voice-recording-overlay` prefix:
- `.tlui-voice-recording-overlay` - Main container
- `.tlui-voice-recording-overlay__status` - Status row
- `.tlui-voice-recording-overlay__dot` - Pulsing red recording indicator
- `.tlui-voice-recording-overlay__spinner` - Processing spinner
- `.tlui-voice-recording-overlay__label` - Status text
- `.tlui-voice-recording-overlay__time` - Elapsed time
- `.tlui-voice-recording-overlay__actions` - Button container
- `.tlui-voice-recording-overlay__button` - Base button style
- `.tlui-voice-recording-overlay__button--stop` - Stop button
- `.tlui-voice-recording-overlay__button--cancel` - Cancel button

## Files

```
VoiceTool/
├── CONTEXT.md                  # This file
├── VoiceTool.ts                # Main tool StateNode
├── VoiceTool.test.ts           # Integration tests
├── audioRecorder.ts            # MediaRecorder wrapper with chunking
├── transcriptionService.ts     # Gemini API client
├── voiceSettings.ts            # LocalStorage settings
├── types.ts                    # TypeScript interfaces for DI
├── childStates/
│   ├── Idle.ts                 # Idle state
│   ├── Recording.ts            # Recording state with chunk support
│   └── Processing.ts           # Processing state with parallel chunks
└── __mocks__/
    ├── audioRecorder.ts        # Mock AudioRecorder for tests
    └── transcriptionService.ts # Mock TranscriptionService for tests
```
