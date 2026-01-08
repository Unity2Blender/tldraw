import { StateNode, toRichText } from '@tldraw/editor'
import { transcribeAudio } from '../transcriptionService'
import { getVoiceApiKey, getVoiceModel } from '../voiceSettings'

interface ProcessingInfo {
	audioBlob: Blob
}

export class Processing extends StateNode {
	static override id = 'processing'

	override async onEnter(info: ProcessingInfo) {
		this.editor.setCursor({ type: 'wait', rotation: 0 })

		const apiKey = getVoiceApiKey()
		const model = getVoiceModel()

		if (!apiKey) {
			this.editor.emit('show-toast' as any, {
				title: 'API key required',
				description: 'Please configure your Gemini API key in voice settings.',
				severity: 'error',
			})
			this.parent.transition('idle')
			return
		}

		try {
			const transcription = await transcribeAudio(info.audioBlob, apiKey, model)

			if (transcription && transcription.trim()) {
				this.createNoteShape(transcription)
				// Show success toast with transcription preview
				const preview =
					transcription.length > 50 ? transcription.slice(0, 50) + '...' : transcription
				this.editor.emit('show-toast' as any, {
					title: 'Transcription complete',
					description: preview,
					severity: 'success',
				})
			} else {
				this.editor.emit('show-toast' as any, {
					title: 'No transcription',
					description: 'Could not transcribe audio. Please try again.',
					severity: 'warning',
				})
			}
		} catch (error) {
			console.error('Transcription failed:', error)
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			this.editor.emit('show-toast' as any, {
				title: 'Transcription failed',
				description: errorMessage,
				severity: 'error',
			})
		}

		this.parent.transition('idle')
	}

	private createNoteShape(text: string) {
		const center = this.editor.getViewportPageBounds().center
		const NOTE_SIZE = 200

		this.editor.createShape({
			type: 'note',
			x: center.x - NOTE_SIZE / 2,
			y: center.y - NOTE_SIZE / 2,
			props: {
				richText: toRichText(text),
				color: 'yellow',
			},
		})
	}

	override onCancel() {
		this.parent.transition('idle')
	}
}
