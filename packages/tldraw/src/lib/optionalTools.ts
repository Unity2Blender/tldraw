/**
 * Optional tools that can be included by users who want additional functionality.
 * These are not included by default to keep the core bundle lean.
 *
 * Note: VoiceTool is now included in defaultTools by default.
 *
 * @example
 * ```tsx
 * import { Tldraw, optionalTools, defaultTools } from 'tldraw'
 *
 * // Include an optional tool
 * <Tldraw tools={[...defaultTools, optionalTools.SomeTool]} />
 * ```
 *
 * @public
 */
export const optionalTools = {} as const
