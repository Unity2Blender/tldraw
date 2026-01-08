import { StateNode, TLStateNodeConstructor } from '@tldraw/editor'
import { Idle } from './childStates/Idle'
import { Processing } from './childStates/Processing'
import { Recording } from './childStates/Recording'

/** @public */
export class VoiceTool extends StateNode {
	static override id = 'voice'
	static override initial = 'idle'
	static override children(): TLStateNodeConstructor[] {
		return [Idle, Recording, Processing]
	}
	static override isLockable = false

	override onEnter() {
		this.editor.setCursor({ type: 'default', rotation: 0 })
	}
}
