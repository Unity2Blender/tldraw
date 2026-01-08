import { useEditor, useValue } from '@tldraw/editor'
import { memo, useCallback, useEffect, useState } from 'react'

type VoiceStatus = 'idle' | 'recording' | 'processing'

/** @internal */
export const VoiceRecordingOverlay = memo(function VoiceRecordingOverlay() {
	const editor = useEditor()
	const [status, setStatus] = useState<VoiceStatus>('idle')
	const [startTime, setStartTime] = useState<number | null>(null)
	const [elapsed, setElapsed] = useState(0)

	// Check if we're in the voice tool
	const isVoiceTool = useValue('is voice tool', () => editor.getCurrentToolId() === 'voice', [
		editor,
	])

	// Check the current state path to determine recording/processing
	const currentPath = useValue('current path', () => editor.getPath(), [editor])

	// Update status based on tool state
	useEffect(() => {
		if (!isVoiceTool) {
			setStatus('idle')
			setStartTime(null)
			return
		}

		if (currentPath === 'voice.recording') {
			if (status !== 'recording') {
				setStatus('recording')
				setStartTime(Date.now())
			}
		} else if (currentPath === 'voice.processing') {
			setStatus('processing')
		} else {
			setStatus('idle')
			setStartTime(null)
		}
	}, [currentPath, isVoiceTool, status])

	// Timer for elapsed recording time
	useEffect(() => {
		if (status !== 'recording' || !startTime) {
			setElapsed(0)
			return
		}

		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startTime) / 1000))
		}, 100)

		return () => clearInterval(interval)
	}, [status, startTime])

	// Handle stop button click
	const handleStop = useCallback(() => {
		// Emit a complete event to stop recording
		editor.emit('voice-stop' as any, {})
	}, [editor])

	// Handle cancel button click
	const handleCancel = useCallback(() => {
		// Emit a cancel event
		editor.emit('voice-cancel' as any, {})
	}, [editor])

	// Format elapsed time as mm:ss
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	if (status === 'idle') {
		return null
	}

	return (
		<div className="tlui-voice-recording-overlay">
			{status === 'recording' && (
				<>
					<div className="tlui-voice-recording-overlay__status">
						<div className="tlui-voice-recording-overlay__dot" />
						<span className="tlui-voice-recording-overlay__label">Recording</span>
						<span className="tlui-voice-recording-overlay__time">{formatTime(elapsed)}</span>
					</div>
					<div className="tlui-voice-recording-overlay__actions">
						<button
							className="tlui-voice-recording-overlay__button tlui-voice-recording-overlay__button--stop"
							onClick={handleStop}
							type="button"
						>
							Stop
						</button>
						<button
							className="tlui-voice-recording-overlay__button tlui-voice-recording-overlay__button--cancel"
							onClick={handleCancel}
							type="button"
						>
							Cancel
						</button>
					</div>
				</>
			)}
			{status === 'processing' && (
				<div className="tlui-voice-recording-overlay__status">
					<div className="tlui-voice-recording-overlay__spinner" />
					<span className="tlui-voice-recording-overlay__label">Processing transcription...</span>
				</div>
			)}
		</div>
	)
})
