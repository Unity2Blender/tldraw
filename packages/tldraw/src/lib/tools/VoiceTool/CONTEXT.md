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

## Files

```
VoiceTool/
├── CONTEXT.md              # This file
├── VoiceTool.ts            # Main tool StateNode
├── audioRecorder.ts        # MediaRecorder wrapper
├── transcriptionService.ts # Gemini API client
├── voiceSettings.ts        # LocalStorage settings
└── childStates/
    ├── Idle.ts             # Idle state
    ├── Recording.ts        # Recording state
    └── Processing.ts       # Processing state
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
