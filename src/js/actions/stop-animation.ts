// @ts-nocheck
import app from "../app";
import config from "../config";
import { Base_action } from "./base";

export class Stop_animation_action extends Base_action {
	reset_layer_visibility: boolean;
	/**
	 * Stops the currently playing animation, both do and undo states will stop animation
	 */
	constructor(reset_layer_visibility: boolean) {
		super("stop_animation", "Stop Animation");
		this.reset_layer_visibility = !!reset_layer_visibility;
	}

	async do() {
		super.do();
		const animation_tool = app.GUI?.GUI_tools?.tools_modules?.animation.object;
		let params = animation_tool?.getParams();
		if (animation_tool?.intervalID == null)
			return;

		clearInterval(animation_tool.intervalID ?? 0);
		params.play = false;
		animation_tool.index = 0;
		animation_tool.GUI_tools?.show_action_attributes();

		// make all visible
		if (this.reset_layer_visibility) {
			for (let i in config.layers) {
				config.layers[i].visible = true;
			}
		}

		animation_tool?.Base_gui?.GUI_layers?.render_layers();
		config.need_render = true;
	}

	async undo() {
		super.undo();
		if( app.GUI === null) {
			throw new Error("GUI not initialized");
		}
		const animation_tool = app.GUI?.GUI_tools?.tools_modules?.animation.object;
		if(animation_tool === undefined) {
			throw new Error("Animation tool not initialized");
		}
		let params = animation_tool.getParams();
		if (animation_tool.intervalID == null)
			return;

		clearInterval(animation_tool.intervalID);
		params.play = false;
		animation_tool.index = 0;
		animation_tool.GUI_tools?.show_action_attributes();

		// make all visible
		if (this.reset_layer_visibility) {
			for (let i in config.layers) {
				config.layers[i].visible = true;
			}
		}

		animation_tool.Base_gui?.GUI_layers?.render_layers();
		config.need_render = true;
	}
}