/**
 * AudioRecorder wraps the MediaRecorder API for voice recording.
 * @public
 */
export class AudioRecorder {
	private mediaRecorder: MediaRecorder | null = null
	private audioChunks: Blob[] = []
	private stream: MediaStream | null = null

	/**
	 * Start recording audio from the user's microphone.
	 */
	async start(): Promise<void> {
		this.audioChunks = []

		this.stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
			},
		})

		// Try to use webm format first, fallback to whatever is available
		const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
			? 'audio/webm;codecs=opus'
			: MediaRecorder.isTypeSupported('audio/webm')
				? 'audio/webm'
				: MediaRecorder.isTypeSupported('audio/mp4')
					? 'audio/mp4'
					: ''

		this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined)

		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				this.audioChunks.push(event.data)
			}
		}

		this.mediaRecorder.start(100) // Collect data every 100ms for chunking
	}

	/**
	 * Stop recording and return the audio blob.
	 */
	async stop(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			if (!this.mediaRecorder) {
				reject(new Error('No recording in progress'))
				return
			}

			this.mediaRecorder.onstop = () => {
				const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
				const audioBlob = new Blob(this.audioChunks, { type: mimeType })
				this.cleanup()
				resolve(audioBlob)
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
	}
}
