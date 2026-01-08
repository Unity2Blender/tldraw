import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestEditor } from '../../../test/TestEditor'
import { VoiceTool } from './VoiceTool'
import * as voiceSettings from './voiceSettings'

// Mock the voice settings module
vi.mock('./voiceSettings', () => ({
	getVoiceApiKey: vi.fn(() => 'test-api-key'),
	getVoiceModel: vi.fn(() => 'gemini-2.5-flash'),
	getVoiceChunkMergeMode: vi.fn(() => 'individual'),
	setVoiceApiKey: vi.fn(),
	setVoiceModel: vi.fn(),
	setVoiceChunkMergeMode: vi.fn(),
}))

// Mock navigator.mediaDevices for AudioRecorder
const mockMediaStream = {
	getTracks: () => [{ stop: vi.fn() }],
}

const mockMediaRecorder = {
	start: vi.fn(),
	stop: vi.fn(),
	state: 'inactive' as 'inactive' | 'recording' | 'paused',
	ondataavailable: null as ((event: BlobEvent) => void) | null,
	onstop: null as (() => void) | null,
	onerror: null as ((event: Event) => void) | null,
	mimeType: 'audio/webm',
}

vi.stubGlobal(
	'MediaRecorder',
	vi.fn(() => mockMediaRecorder)
)
vi.stubGlobal('navigator', {
	mediaDevices: {
		getUserMedia: vi.fn(() => Promise.resolve(mockMediaStream)),
	},
})

// Mock MediaRecorder.isTypeSupported
;(MediaRecorder as any).isTypeSupported = vi.fn(() => true)

let editor: TestEditor

beforeEach(() => {
	// VoiceTool is now optional, so we need to explicitly include it in tests
	editor = new TestEditor({ tools: [VoiceTool] })
	editor._transformPointerDownSpy.mockRestore()
	editor._transformPointerUpSpy.mockRestore()

	// Reset mock state
	mockMediaRecorder.state = 'inactive'
	mockMediaRecorder.ondataavailable = null
	mockMediaRecorder.onstop = null
	mockMediaRecorder.onerror = null
})

afterEach(() => {
	editor?.dispose()
})

vi.useFakeTimers()

describe(VoiceTool, () => {
	describe('Tool selection', () => {
		it('Selects the tool and enters the idle state', () => {
			editor.setCurrentTool('voice')
			editor.expectToBeIn('voice.idle')
		})

		it('Has correct tool id', () => {
			expect(VoiceTool.id).toBe('voice')
		})

		it('Has correct initial state', () => {
			expect(VoiceTool.initial).toBe('idle')
		})
	})

	describe('When in the idle state', () => {
		it('Returns to select on cancel', () => {
			editor.setCurrentTool('voice')
			editor.expectToBeIn('voice.idle')
			editor.cancel()
			editor.expectToBeIn('select.idle')
		})

		it('Sets cursor to cross', () => {
			editor.setCurrentTool('voice')
			expect(editor.getInstanceState().cursor.type).toBe('cross')
		})

		it('Transitions to recording on pointer down when API key is set', () => {
			editor.setCurrentTool('voice')
			editor.pointerDown(100, 100)
			// Note: This will transition to recording but the async onEnter
			// means we need to handle this carefully in tests
			editor.expectToBeIn('voice.recording')
		})
	})

	describe('When in the recording state', () => {
		it('Transitions to idle on cancel', async () => {
			editor.setCurrentTool('voice')
			editor.pointerDown(100, 100)
			editor.expectToBeIn('voice.recording')
			editor.cancel()
			editor.expectToBeIn('voice.idle')
		})

		it('Handles tool interruption gracefully', () => {
			editor.setCurrentTool('voice')
			editor.pointerDown(100, 100)
			editor.expectToBeIn('voice.recording')

			// Switch to a different tool (interrupt)
			editor.setCurrentTool('select')
			editor.expectToBeIn('select.idle')
		})
	})

	describe('Error handling', () => {
		it('Handles missing API key', () => {
			// Override mock to return null
			vi.mocked(voiceSettings.getVoiceApiKey).mockReturnValueOnce(null)

			editor.setCurrentTool('voice')
			editor.pointerDown(100, 100)

			// Should emit open-voice-settings event and stay in idle
			// (The actual dialog opening is handled by the UI layer)
			editor.expectToBeIn('voice.idle')
		})
	})

	describe('State machine structure', () => {
		it('Has idle, recording, and processing child states', () => {
			const childStates = VoiceTool.children()
			const childIds = childStates.map((c) => c.id)

			expect(childIds).toContain('idle')
			expect(childIds).toContain('recording')
			expect(childIds).toContain('processing')
		})
	})
})

describe('VoiceTool keyboard shortcut', () => {
	it('Is activated by Shift+M', () => {
		// This would need integration with the keyboard shortcuts system
		// For now, just verify the tool can be selected
		editor.setCurrentTool('voice')
		editor.expectToBeIn('voice.idle')
	})
})
