import { ITranscriptionService } from '../types'

/**
 * Mock TranscriptionService for testing.
 * Simulates API calls without making real network requests.
 */
export class MockTranscriptionService implements ITranscriptionService {
	public transcribeCalled = false
	public transcribeCallCount = 0
	public lastAudioBlob: Blob | null = null
	public lastApiKey: string | null = null
	public lastModel: string | null = null

	/** Configurable delay for transcription (simulates network latency) */
	public transcribeDelay = 0
	/** If set, transcribe() will throw this error */
	public transcribeError: Error | null = null
	/** The text returned by transcribe() */
	public mockTranscription = 'Hello, this is a test transcription.'
	/** For simulating different responses per call */
	public transcriptionQueue: string[] = []

	async transcribe(audioBlob: Blob, apiKey: string, model: string): Promise<string> {
		this.transcribeCalled = true
		this.transcribeCallCount++
		this.lastAudioBlob = audioBlob
		this.lastApiKey = apiKey
		this.lastModel = model

		if (this.transcribeDelay > 0) {
			await new Promise((resolve) => setTimeout(resolve, this.transcribeDelay))
		}

		if (this.transcribeError) {
			throw this.transcribeError
		}

		// If queue has items, use those (for testing multiple chunks)
		if (this.transcriptionQueue.length > 0) {
			return this.transcriptionQueue.shift()!
		}

		return this.mockTranscription
	}

	/** Reset all state for reuse between tests */
	reset(): void {
		this.transcribeCalled = false
		this.transcribeCallCount = 0
		this.lastAudioBlob = null
		this.lastApiKey = null
		this.lastModel = null
		this.transcribeDelay = 0
		this.transcribeError = null
		this.mockTranscription = 'Hello, this is a test transcription.'
		this.transcriptionQueue = []
	}

	/** Queue multiple transcription results for testing chunking */
	queueTranscriptions(...transcriptions: string[]): void {
		this.transcriptionQueue.push(...transcriptions)
	}
}

/**
 * Factory function that creates a mock transcription service.
 * Use this for dependency injection in tests.
 */
export function createMockTranscriptionService(): MockTranscriptionService {
	return new MockTranscriptionService()
}
