import { useState } from 'react'
import { GEMINI_MODELS, GeminiModelId } from '../../tools/VoiceTool/transcriptionService'
import type { ChunkMergeMode } from '../../tools/VoiceTool/types'
import {
	clearVoiceApiKey,
	getVoiceApiKey,
	getVoiceChunkMergeMode,
	getVoiceModel,
	setVoiceApiKey,
	setVoiceChunkMergeMode,
	setVoiceModel,
} from '../../tools/VoiceTool/voiceSettings'
import { TLUiDialogProps } from '../context/dialogs'
import { TldrawUiButton } from './primitives/Button/TldrawUiButton'
import { TldrawUiButtonLabel } from './primitives/Button/TldrawUiButtonLabel'
import {
	TldrawUiDialogBody,
	TldrawUiDialogCloseButton,
	TldrawUiDialogFooter,
	TldrawUiDialogHeader,
	TldrawUiDialogTitle,
} from './primitives/TldrawUiDialog'

/** @public */
export function VoiceSettingsDialog({ onClose }: TLUiDialogProps) {
	const [apiKey, setApiKeyState] = useState(getVoiceApiKey() || '')
	const [model, setModelState] = useState<GeminiModelId>(getVoiceModel())
	const [chunkMergeMode, setChunkMergeModeState] =
		useState<ChunkMergeMode>(getVoiceChunkMergeMode())
	const [showApiKey, setShowApiKey] = useState(false)

	const handleSave = () => {
		if (apiKey.trim()) {
			setVoiceApiKey(apiKey.trim())
		} else {
			clearVoiceApiKey()
		}
		setVoiceModel(model)
		setVoiceChunkMergeMode(chunkMergeMode)
		onClose()
	}

	return (
		<>
			<TldrawUiDialogHeader>
				<TldrawUiDialogTitle>Voice settings</TldrawUiDialogTitle>
				<TldrawUiDialogCloseButton />
			</TldrawUiDialogHeader>
			<TldrawUiDialogBody className="tlui-voice-settings-dialog">
				<div className="tlui-voice-settings-dialog__section">
					<label className="tlui-voice-settings-dialog__label">Gemini API key</label>
					<div className="tlui-voice-settings-dialog__input-row">
						<input
							className="tlui-input tlui-voice-settings-dialog__input"
							value={apiKey}
							type={showApiKey ? 'text' : 'password'}
							placeholder="Enter your API key"
							onChange={(e) => setApiKeyState(e.target.value)}
						/>
						<TldrawUiButton type="normal" onClick={() => setShowApiKey(!showApiKey)}>
							<TldrawUiButtonLabel>{showApiKey ? 'Hide' : 'Show'}</TldrawUiButtonLabel>
						</TldrawUiButton>
					</div>
					<a
						href="https://aistudio.google.com/apikey"
						target="_blank"
						rel="noopener noreferrer"
						className="tlui-voice-settings-dialog__link"
					>
						Get an API key from Google AI Studio
					</a>
				</div>

				<div className="tlui-voice-settings-dialog__section">
					<label className="tlui-voice-settings-dialog__label">Model</label>
					<select
						className="tlui-voice-settings-dialog__select"
						value={model}
						onChange={(e) => setModelState(e.target.value as GeminiModelId)}
					>
						{GEMINI_MODELS.map((m) => (
							<option key={m.id} value={m.id}>
								{m.name}
							</option>
						))}
					</select>
					<p className="tlui-voice-settings-dialog__hint">
						{GEMINI_MODELS.find((m) => m.id === model)?.description}
					</p>
				</div>

				<div className="tlui-voice-settings-dialog__section">
					<label className="tlui-voice-settings-dialog__label">Long recordings</label>
					<select
						className="tlui-voice-settings-dialog__select"
						value={chunkMergeMode}
						onChange={(e) => setChunkMergeModeState(e.target.value as ChunkMergeMode)}
					>
						<option value="individual">Create separate notes for each segment</option>
						<option value="merged">Combine all text into one note</option>
					</select>
					<p className="tlui-voice-settings-dialog__hint">
						{chunkMergeMode === 'individual'
							? 'Recordings over 45 seconds will create multiple sticky notes, one per segment.'
							: 'All segments will be merged into a single sticky note with the full transcription.'}
					</p>
				</div>
			</TldrawUiDialogBody>
			<TldrawUiDialogFooter className="tlui-dialog__footer__actions">
				<TldrawUiButton type="normal" onClick={onClose}>
					<TldrawUiButtonLabel>Cancel</TldrawUiButtonLabel>
				</TldrawUiButton>
				<TldrawUiButton type="primary" onClick={handleSave}>
					<TldrawUiButtonLabel>Save</TldrawUiButtonLabel>
				</TldrawUiButton>
			</TldrawUiDialogFooter>
		</>
	)
}
