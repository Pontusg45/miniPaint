import app from "../app";
import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";
import GUI_tools_class from "../core/gui/gui-tools";
import Base_gui_class from "../core/base-gui";
import Base_selection_class from "../core/base-selection";
import { Toggle_layer_visibility_action } from "../actions";
import { Layer } from "../../../types/types";

class Animation_class extends Base_tools_class {

  Base_selection: Base_selection_class | undefined;
  private GUI_tools: GUI_tools_class;
  private intervalID: null;
  private index: number;
  private toggle_layer_visibility_action: Toggle_layer_visibility_action;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.GUI_tools = new GUI_tools_class();
		this.Base_gui = new Base_gui_class();
		this.name = "animation";
		this.intervalID = null;
		this.index = 0;
		this.toggle_layer_visibility_action = new app.Actions.Toggle_layer_visibility_action();

		this.disable_selection(ctx);
	}

	load() {
		//nothing
	}

	render(ctx: CanvasRenderingContext2D, layer: any) {
		//nothing
	}

	/**
	 * disable_selection
	 */
	disable_selection(ctx: CanvasRenderingContext2D) {
		const sel_config = {
			enable_background: false,
			enable_borders: false,
			enable_controls: false,
			enable_rotation: false,
			enable_move: false,
			data_function: function () {
				return null;
			},
		};
		this.Base_selection = new Base_selection_class(ctx, sel_config as any, this.name);
	}

	on_params_update(data: { key: string; }) {
		if(data.key != "play")
			return;

		const params = this.getParams();
		if (config.layers.length == 1) {
			alert("Can not animate 1 layer.");
			return;
		}
		this.stop();

		// @ts-ignore
		if (params.play) {
			// @ts-ignore
			this.start(params.delay);
		}
	}

	on_activate() {
		return [
			new app.Actions.Stop_animation_action(false)
		];
	}

	on_leave() {
		return [
			new app.Actions.Stop_animation_action(true)
		];
	}

	start(delay: number) {
		const _this = this;
		if (delay < 0)
			delay = 50;

		this.intervalID = window.setInterval(function () {
			_this.play(_this);
		}, delay) as any;
	}

	stop() {
		new app.Actions.Stop_animation_action(true).do();
	}

	play(_this: this) {

		for (const i in config.layers) {
			config.layers[i].visible = false;
		}

		//show 1
		if (config.layers[this.index] != undefined) {
			this.toggle_layer_visibility_action.layer_id = config.layers[this.index].id;
			this.toggle_layer_visibility_action.do();
		}

		//change index
		if (config.layers[this.index + 1] != undefined) {
			this.index++;
		}
		else {
			this.index = 0;
		}
	}

}

export default Animation_class;
