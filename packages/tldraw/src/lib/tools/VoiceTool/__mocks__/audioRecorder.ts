import type { AudioRecordingResult, IAudioRecorder, OnChunkCallback } from '../types'

/**
 * Mock AudioRecorder for testing.
 * Simulates recording behavior without requiring browser APIs.
 */
export class MockAudioRecorder implements IAudioRecorder {
	public isRecording = false
	public startCalled = false
	public stopCalled = false
	public cancelCalled = false

	/** Configurable delay for start (simulates mic permission request) */
	public startDelay = 0
	/** Configurable delay for stop (simulates processing) */
	public stopDelay = 0
	/** If set, start() will throw this error */
	public startError: Error | null = null
	/** If set, stop() will throw this error */
	public stopError: Error | null = null
	/** The blob returned by stop() */
	public mockBlob: Blob = new Blob(['mock audio data'], { type: 'audio/webm' })
	/** Mock chunks for testing chunking behavior */
	public mockChunks: Blob[] = []
	/** Stored onChunk callback for testing */
	private onChunkCallback: OnChunkCallback | null = null

	async start(onChunk?: OnChunkCallback): Promise<void> {
		this.startCalled = true
		this.onChunkCallback = onChunk ?? null

		if (this.startDelay > 0) {
			await new Promise((resolve) => setTimeout(resolve, this.startDelay))
		}

		if (this.startError) {
			throw this.startError
		}

		this.isRecording = true
	}

	async stop(): Promise<AudioRecordingResult> {
		this.stopCalled = true

		if (this.stopDelay > 0) {
			await new Promise((resolve) => setTimeout(resolve, this.stopDelay))
		}

		if (this.stopError) {
			throw this.stopError
		}

		this.isRecording = false

		// If no chunks configured, return single-chunk result
		const chunks = this.mockChunks.length > 0 ? this.mockChunks : [this.mockBlob]

		return {
			blob: this.mockBlob,
			chunks,
		}
	}

	cancel(): void {
		this.cancelCalled = true
		this.isRecording = false
	}

	/** Simulate a chunk being emitted (for testing chunking) */
	emitChunk(chunk: Blob, index: number): void {
		if (this.onChunkCallback) {
			this.onChunkCallback(chunk, index)
		}
	}

	/** Configure mock chunks for multi-chunk recording tests */
	setMockChunks(chunks: Blob[]): void {
		this.mockChunks = chunks
	}

	/** Reset all state for reuse between tests */
	reset(): void {
		this.isRecording = false
		this.startCalled = false
		this.stopCalled = false
		this.cancelCalled = false
		this.startDelay = 0
		this.stopDelay = 0
		this.startError = null
		this.stopError = null
		this.mockChunks = []
		this.onChunkCallback = null
	}
}

/**
 * Factory function that creates a mock recorder.
 * Use this for dependency injection in tests.
 */
export function createMockAudioRecorder(): MockAudioRecorder {
	return new MockAudioRecorder()
}
