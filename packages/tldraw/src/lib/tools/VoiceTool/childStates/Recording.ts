import { StateNode } from '@tldraw/editor'
import { AudioRecorder } from '../audioRecorder'

export class Recording extends StateNode {
	static override id = 'recording'

	private recorder: AudioRecorder | null = null
	private recordingStartTime = 0

	override async onEnter() {
		this.editor.setCursor({ type: 'grabbing', rotation: 0 })

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
	}

	override onPointerUp() {
		this.complete()
	}

	override onCancel() {
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
			const audioBlob = await this.recorder.stop()
			const recordingDuration = Date.now() - this.recordingStartTime

			// Minimum recording duration of 500ms
			if (recordingDuration < 500) {
				this.parent.transition('idle')
				return
			}

			this.parent.transition('processing', { audioBlob })
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
