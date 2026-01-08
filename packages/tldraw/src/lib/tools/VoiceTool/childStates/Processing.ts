import { StateNode, toRichText } from '@tldraw/editor'
import { transcribeAudio } from '../transcriptionService'
import type { ChunkMergeMode } from '../types'
import { getVoiceApiKey, getVoiceChunkMergeMode, getVoiceModel } from '../voiceSettings'

interface ProcessingInfo {
	audioBlob: Blob
	chunks: Blob[]
}

interface ChunkResult {
	index: number
	text: string
	success: boolean
	error?: string
}

export class Processing extends StateNode {
	static override id = 'processing'

	private abortController: AbortController | null = null

	override async onEnter(info: ProcessingInfo) {
		this.abortController = new AbortController()
		this.editor.setCursor({ type: 'default', rotation: 0 })

		const apiKey = getVoiceApiKey()
		const model = getVoiceModel()
		const chunkMergeMode = getVoiceChunkMergeMode()

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
			// Decide whether to process chunks in parallel or use the single blob
			if (info.chunks.length > 1) {
				await this.processChunks(info.chunks, apiKey, model, chunkMergeMode)
			} else {
				// Single chunk or short recording - use the blob directly
				await this.processSingleBlob(info.audioBlob, apiKey, model)
			}
		} catch (error) {
			// Don't show error toast if we were intentionally aborted
			if (error instanceof Error && error.name === 'AbortError') {
				return
			}
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

	/**
	 * Process a single audio blob (for short recordings).
	 */
	private async processSingleBlob(audioBlob: Blob, apiKey: string, model: string) {
		const transcription = await transcribeAudio(
			audioBlob,
			apiKey,
			model,
			this.abortController!.signal
		)

		// Check if we were aborted during transcription
		if (this.abortController!.signal.aborted) {
			return
		}

		if (transcription && transcription.trim()) {
			this.createNoteShape(transcription)
			// Show success toast with transcription preview
			const preview = transcription.length > 50 ? transcription.slice(0, 50) + '...' : transcription
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
	}

	/**
	 * Process multiple chunks in parallel.
	 */
	private async processChunks(
		chunks: Blob[],
		apiKey: string,
		model: string,
		mergeMode: ChunkMergeMode
	) {
		// Transcribe all chunks in parallel
		const results = await Promise.all(
			chunks.map(async (chunk, index): Promise<ChunkResult> => {
				try {
					const text = await transcribeAudio(chunk, apiKey, model, this.abortController!.signal)
					return { index, text: text.trim(), success: true }
				} catch (error) {
					// If aborted, propagate the error
					if (error instanceof Error && error.name === 'AbortError') {
						throw error
					}
					return {
						index,
						text: '',
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error',
					}
				}
			})
		)

		// Check if we were aborted
		if (this.abortController!.signal.aborted) {
			return
		}

		// Filter successful results and sort by index
		const successfulResults = results
			.filter((r) => r.success && r.text)
			.sort((a, b) => a.index - b.index)

		if (successfulResults.length === 0) {
			this.editor.emit('show-toast' as any, {
				title: 'No transcription',
				description: 'Could not transcribe any audio chunks. Please try again.',
				severity: 'warning',
			})
			return
		}

		// Handle based on merge mode
		if (mergeMode === 'merged') {
			// Combine all text into one note
			const combinedText = successfulResults.map((r) => r.text).join('\n\n')
			this.createNoteShape(combinedText)
			this.editor.emit('show-toast' as any, {
				title: 'Transcription complete',
				description: `Merged ${successfulResults.length} segments into one note.`,
				severity: 'success',
			})
		} else {
			// Create individual notes for each chunk
			const center = this.editor.getViewportPageBounds().center
			const NOTE_SIZE = 200
			const NOTE_SPACING = 220

			successfulResults.forEach((result, i) => {
				this.editor.createShape({
					type: 'note',
					x: center.x - NOTE_SIZE / 2 + i * NOTE_SPACING,
					y: center.y - NOTE_SIZE / 2,
					props: {
						richText: toRichText(result.text),
						color: 'yellow',
					},
				})
			})

			this.editor.emit('show-toast' as any, {
				title: 'Transcription complete',
				description: `Created ${successfulResults.length} notes.`,
				severity: 'success',
			})
		}

		// Report any failures
		const failedCount = results.filter((r) => !r.success).length
		if (failedCount > 0) {
			console.warn(`${failedCount} chunk(s) failed to transcribe`)
		}
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
		this.abortController?.abort()
		this.parent.transition('idle')
	}

	override onInterrupt() {
		// Tool was interrupted (user switched tools) - cancel transcription
		this.abortController?.abort()
		this.parent.transition('idle')
	}
}
