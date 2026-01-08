import { StateNode, TLPointerEventInfo } from '@tldraw/editor'
import { AudioRecorder } from '../audioRecorder'

export class Recording extends StateNode {
	static override id = 'recording'

	private recorder: AudioRecorder | null = null
	private recordingStartTime = 0
	private stopListener: (() => void) | null = null
	private cancelListener: (() => void) | null = null

	override async onEnter() {
		this.editor.setCursor({ type: 'cross', rotation: 0 })

		// Listen for stop/cancel events from the UI overlay
		const handleStop = () => this.complete()
		const handleCancel = () => this.cancel()

		this.editor.addListener('voice-stop' as any, handleStop)
		this.editor.addListener('voice-cancel' as any, handleCancel)

		this.stopListener = () => this.editor.removeListener('voice-stop' as any, handleStop)
		this.cancelListener = () => this.editor.removeListener('voice-cancel' as any, handleCancel)

		try {
			this.recorder = new AudioRecorder()
			await this.recorder.start()
			this.recordingStartTime = Date.now()
		} catch (error) {
			console.error('Failed to start recording:', error)
			this.editor.emit('show-toast' as any, {
				title: 'Recording failed',
				description: 'Could not access microphone. Please check permissions.',
				severity: 'error',
			})
			this.parent.transition('idle')
		}
	}

	override onExit() {
		this.editor.setCursor({ type: 'default', rotation: 0 })

		// Clean up event listeners
		if (this.stopListener) {
			this.stopListener()
			this.stopListener = null
		}
		if (this.cancelListener) {
			this.cancelListener()
			this.cancelListener = null
		}
	}

	// Toggle mode: clicking again stops recording
	override onPointerDown(_info: TLPointerEventInfo) {
		this.complete()
	}

	override onCancel() {
		this.cancel()
	}

	override onInterrupt() {
		// Tool was interrupted (user switched tools) - cancel recording
		this.cancel()
	}

	override onComplete() {
		this.complete()
	}

	private async complete() {
		if (!this.recorder) {
			this.parent.transition('idle')
			return
		}

		try {
			const result = await this.recorder.stop()
			const recordingDuration = Date.now() - this.recordingStartTime

			// Minimum recording duration of 500ms
			if (recordingDuration < 500) {
				this.editor.emit('show-toast' as any, {
					title: 'Recording too short',
					description: 'Please record for at least half a second.',
					severity: 'warning',
				})
				this.parent.transition('idle')
				return
			}

			this.parent.transition('processing', {
				audioBlob: result.blob,
				chunks: result.chunks,
			})
		} catch (error) {
			console.error('Failed to stop recording:', error)
			this.parent.transition('idle')
		}
	}

	private cancel() {
		if (this.recorder) {
			this.recorder.cancel()
		}
		this.parent.transition('idle')
	}
}
