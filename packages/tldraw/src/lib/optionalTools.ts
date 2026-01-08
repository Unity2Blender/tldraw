import { VoiceTool } from './tools/VoiceTool/VoiceTool'

/**
 * Optional tools that can be included by users who want additional functionality.
 * These are not included by default to keep the core bundle lean.
 *
 * @example
 * ```tsx
 * import { Tldraw, optionalTools, defaultTools } from 'tldraw'
 *
 * // Include voice tool
 * <Tldraw tools={[...defaultTools, optionalTools.VoiceTool]} />
 *
 * // Or access VoiceTool directly
 * import { VoiceTool } from 'tldraw'
 * <Tldraw tools={[...defaultTools, VoiceTool]} />
 * ```
 *
 * @public
 */
export const optionalTools = {
	VoiceTool,
} as const

export { VoiceTool }
