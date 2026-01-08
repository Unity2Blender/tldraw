import { DEFAULT_MODEL, GeminiModelId } from './transcriptionService'

const STORAGE_KEY_API_KEY = 'tldraw_voice_api_key'
const STORAGE_KEY_MODEL = 'tldraw_voice_model'

/**
 * Get the stored Gemini API key.
 * @public
 */
export function getVoiceApiKey(): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem(STORAGE_KEY_API_KEY)
}

/**
 * Set the Gemini API key.
 * @public
 */
export function setVoiceApiKey(apiKey: string): void {
	if (typeof window === 'undefined') return
	localStorage.setItem(STORAGE_KEY_API_KEY, apiKey)
}

/**
 * Clear the stored Gemini API key.
 * @public
 */
export function clearVoiceApiKey(): void {
	if (typeof window === 'undefined') return
	localStorage.removeItem(STORAGE_KEY_API_KEY)
}

/**
 * Get the selected Gemini model.
 * @public
 */
export function getVoiceModel(): GeminiModelId {
	if (typeof window === 'undefined') return DEFAULT_MODEL
	return (localStorage.getItem(STORAGE_KEY_MODEL) as GeminiModelId) || DEFAULT_MODEL
}

/**
 * Set the selected Gemini model.
 * @public
 */
export function setVoiceModel(model: GeminiModelId): void {
	if (typeof window === 'undefined') return
	localStorage.setItem(STORAGE_KEY_MODEL, model)
}
