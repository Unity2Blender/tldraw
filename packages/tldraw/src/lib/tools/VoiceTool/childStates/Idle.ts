import { StateNode, TLPointerEventInfo } from '@tldraw/editor'
import { getVoiceApiKey } from '../voiceSettings'

export class Idle extends StateNode {
	static override id = 'idle'

	override onEnter() {
		this.editor.setCursor({ type: 'default', rotation: 0 })
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
		this.parent.transition('recording', info)
	}
}
