import type { AudioRecordingResult, OnChunkCallback } from './types'

/** Chunk duration in milliseconds (45 seconds) */
const CHUNK_DURATION_MS = 45_000

/**
 * AudioRecorder wraps the MediaRecorder API for voice recording.
 * Supports automatic chunking for long recordings.
 * @public
 */
export class AudioRecorder {
	private mediaRecorder: MediaRecorder | null = null
	private audioChunks: Blob[] = []
	private stream: MediaStream | null = null
	private chunkInterval: ReturnType<typeof setInterval> | null = null
	private completedChunks: Blob[] = []
	private chunkIndex = 0
	private onChunkCallback: OnChunkCallback | null = null
	private mimeType = 'audio/webm'

	/**
	 * Start recording audio from the user's microphone.
	 * @param onChunk - Optional callback for when a chunk is ready (every 45 seconds)
	 */
	async start(onChunk?: OnChunkCallback): Promise<void> {
		this.audioChunks = []
		this.completedChunks = []
		this.chunkIndex = 0
		this.onChunkCallback = onChunk ?? null

		this.stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
			},
		})

		// Try to use webm format first, fallback to whatever is available
		this.mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
			? 'audio/webm;codecs=opus'
			: MediaRecorder.isTypeSupported('audio/webm')
				? 'audio/webm'
				: MediaRecorder.isTypeSupported('audio/mp4')
					? 'audio/mp4'
					: ''

		this.mediaRecorder = new MediaRecorder(
			this.stream,
			this.mimeType ? { mimeType: this.mimeType } : undefined
		)

		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				this.audioChunks.push(event.data)
			}
		}

		this.mediaRecorder.start(100) // Collect data every 100ms

		// If a chunk callback is provided, set up chunking interval
		if (onChunk) {
			this.chunkInterval = setInterval(() => {
				this.emitCurrentChunk()
			}, CHUNK_DURATION_MS)
		}
	}

	/**
	 * Emit the current audio chunks as a completed chunk and start fresh.
	 */
	private emitCurrentChunk(): void {
		if (this.audioChunks.length === 0) return

		const chunk = new Blob(this.audioChunks, { type: this.mimeType })
		this.completedChunks.push(chunk)

		if (this.onChunkCallback) {
			this.onChunkCallback(chunk, this.chunkIndex)
		}

		this.chunkIndex++
		this.audioChunks = []
	}

	/**
	 * Stop recording and return the audio blob and chunks.
	 */
	async stop(): Promise<AudioRecordingResult> {
		// Clear chunking interval
		if (this.chunkInterval) {
			clearInterval(this.chunkInterval)
			this.chunkInterval = null
		}

		return new Promise((resolve, reject) => {
			if (!this.mediaRecorder) {
				reject(new Error('No recording in progress'))
				return
			}

			this.mediaRecorder.onstop = () => {
				// Create final chunk from any remaining audio data
				if (this.audioChunks.length > 0) {
					const finalChunk = new Blob(this.audioChunks, { type: this.mimeType })
					this.completedChunks.push(finalChunk)

					if (this.onChunkCallback) {
						this.onChunkCallback(finalChunk, this.chunkIndex)
					}
				}

				// Create the complete blob from all chunks
				const blob = new Blob(this.completedChunks, { type: this.mimeType })
				const chunks = [...this.completedChunks]

				this.cleanup()
				resolve({ blob, chunks })
			}

			this.mediaRecorder.onerror = (event) => {
				this.cleanup()
				reject(new Error('Recording failed: ' + (event as any).error?.message))
			}

			this.mediaRecorder.stop()
		})
	}

	/**
	 * Cancel the current recording without returning data.
	 */
	cancel(): void {
		if (this.chunkInterval) {
			clearInterval(this.chunkInterval)
			this.chunkInterval = null
		}
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop()
		}
		this.cleanup()
	}

	private cleanup(): void {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop())
			this.stream = null
		}
		this.mediaRecorder = null
		this.audioChunks = []
		this.completedChunks = []
		this.chunkIndex = 0
		this.onChunkCallback = null
	}
}
