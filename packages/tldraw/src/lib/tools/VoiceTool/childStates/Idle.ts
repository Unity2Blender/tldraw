import { StateNode, TLPointerEventInfo } from '@tldraw/editor'
import { getVoiceApiKey } from '../voiceSettings'

export class Idle extends StateNode {
	static override id = 'idle'

	override onEnter() {
		// Use cross cursor to indicate "click to record"
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onCancel() {
		this.editor.setCurrentTool('select')
	}

	override onPointerDown(info: TLPointerEventInfo) {
		const apiKey = getVoiceApiKey()
		if (!apiKey) {
			this.editor.emit('open-voice-settings' as any, {})
			return
		}
		// Start recording on click (toggle mode)
		this.parent.transition('recording', info)
	}
}
