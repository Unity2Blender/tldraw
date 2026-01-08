import { EraserTool } from './tools/EraserTool/EraserTool'
import { HandTool } from './tools/HandTool/HandTool'
import { LaserTool } from './tools/LaserTool/LaserTool'
import { SelectTool } from './tools/SelectTool/SelectTool'
import { VoiceTool } from './tools/VoiceTool/VoiceTool'
import { ZoomTool } from './tools/ZoomTool/ZoomTool'

/** @public */
export const defaultTools = [
	EraserTool,
	HandTool,
	LaserTool,
	VoiceTool,
	ZoomTool,
	SelectTool,
] as const
