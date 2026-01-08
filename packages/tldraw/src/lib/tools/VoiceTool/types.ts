/**
 * Callback for when an audio chunk is ready during recording.
 * @public
 */
export type OnChunkCallback = (chunk: Blob, index: number) => void

/**
 * Result from stopping recording, includes the final blob and any chunks.
 * @public
 */
export interface AudioRecordingResult {
	/** The complete audio blob */
	blob: Blob
	/** Individual chunks (if chunking was enabled) */
	chunks: Blob[]
}

/**
 * Interface for audio recording functionality.
 * Allows injection of mock implementations for testing.
 * @public
 */
export interface IAudioRecorder {
	start(onChunk?: OnChunkCallback): Promise<void>
	stop(): Promise<AudioRecordingResult>
	cancel(): void
}

/**
 * Interface for transcription service.
 * Allows injection of custom providers (OpenAI Whisper, local models, etc.)
 * @public
 */
export interface ITranscriptionService {
	transcribe(audioBlob: Blob, apiKey: string, model: string, signal?: AbortSignal): Promise<string>
}

/**
 * Configuration for VoiceTool.
 * Allows customization of dependencies and behavior.
 * @public
 */
export interface VoiceToolConfig {
	/** Custom transcription service (defaults to Gemini API) */
	transcriptionService?: ITranscriptionService
	/** Custom audio recorder factory (defaults to AudioRecorder) */
	createAudioRecorder?: () => IAudioRecorder
	/** Custom function to get API key (defaults to localStorage) */
	getApiKey?: () => string | null
	/** Custom function to get model (defaults to localStorage) */
	getModel?: () => string
	/** Custom function to get chunk merge mode */
	getChunkMergeMode?: () => ChunkMergeMode
}

/**
 * How to handle multiple chunks from long recordings.
 * @public
 */
export type ChunkMergeMode = 'individual' | 'merged'

/**
 * Voice settings stored in localStorage.
 * @public
 */
export interface VoiceSettings {
	apiKey: string
	model: string
	chunkMergeMode: ChunkMergeMode
}

/**
 * Result from processing audio chunks.
 * @internal
 */
export interface ChunkTranscriptionResult {
	index: number
	text: string
	success: boolean
	error?: string
}
