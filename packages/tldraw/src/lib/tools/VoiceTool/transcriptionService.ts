/**
 * Gemini model options for audio transcription.
 * @public
 */
export const GEMINI_MODELS = [
	{
		id: 'gemini-2.5-flash',
		name: 'Gemini 2.5 Flash (Recommended)',
		description: 'Fast, stable, good quality',
	},
	{
		id: 'gemini-2.5-flash-lite',
		name: 'Gemini 2.5 Flash Lite',
		description: 'Fastest, lowest cost',
	},
	{
		id: 'gemini-2.5-pro',
		name: 'Gemini 2.5 Pro',
		description: 'Highest quality, slower',
	},
	{
		id: 'gemini-2.0-flash',
		name: 'Gemini 2.0 Flash',
		description: 'Legacy stable',
	},
] as const

/** @public */
export type GeminiModelId = (typeof GEMINI_MODELS)[number]['id']

/** @public */
export const DEFAULT_MODEL: GeminiModelId = 'gemini-2.5-flash'

/**
 * Convert a Blob to base64 string.
 */
async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onloadend = () => {
			const base64 = reader.result as string
			// Remove the data URL prefix (e.g., "data:audio/webm;base64,")
			const base64Data = base64.split(',')[1]
			resolve(base64Data)
		}
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}

/**
 * Transcribe audio using the Gemini API.
 * @param audioBlob - The audio blob to transcribe
 * @param apiKey - The Gemini API key
 * @param model - The Gemini model to use
 * @returns The transcribed text
 * @public
 */
export async function transcribeAudio(
	audioBlob: Blob,
	apiKey: string,
	model: string = DEFAULT_MODEL
): Promise<string> {
	const base64Audio = await blobToBase64(audioBlob)
	const mimeType = audioBlob.type || 'audio/webm'

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								inlineData: {
									mimeType,
									data: base64Audio,
								},
							},
							{
								text: 'Transcribe this audio accurately. Return only the transcription text, nothing else.',
							},
						],
					},
				],
				generationConfig: {
					temperature: 0.1,
					maxOutputTokens: 8192,
				},
			}),
		}
	)

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}))
		const errorMessage =
			errorData.error?.message || `API request failed with status ${response.status}`
		throw new Error(errorMessage)
	}

	const data = await response.json()

	// Extract the transcription text from the response
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text
	if (!text) {
		throw new Error('No transcription returned from API')
	}

	return text.trim()
}
