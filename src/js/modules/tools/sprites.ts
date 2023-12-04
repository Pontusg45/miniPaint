import app from "../../app.js";
import config from "../../config.js";
import Base_layers_class from "../../core/base-layers.js";
import Dialog_class from "../../libs/popup.js";
import Image_trim_class from "../image/trim.js";
import Base_gui_class from "../../core/base-gui.js";
import { Base_action } from "../../actions/base.js";
import { DialogConfig, Layer, Params } from "../../../../types/types.js";

class Tools_sprites_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Image_trim: Image_trim_class;
	Base_gui: Base_gui_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Image_trim = new Image_trim_class();
		this.Base_gui = new Base_gui_class();
	}

	sprites() {
		let _this = this;

		let settings = {
			title: "Sprites",
			params: [
				{name: "gap", title: "Gap:", value: "50", values: ["0", "10", "50", "100"]},
			],
			on_finish: function (params: Params) {
				_this.generate_sprites(params.gap);
			},
		};
		this.POP.show(settings as DialogConfig);
	}

	generate_sprites(gap: number, sprite_width?: undefined) {

		if (config.layers.length == 1) {
			alert("There is only 1 layer.");
			return false;
		}

		let xx = 0;
		let yy = 0;
		let max_height = 0;
		let actions = [];
		let new_height = config.HEIGHT;
		let new_width = config.WIDTH;

		//collect trim info
		let trim_details_array = [];
		for (let i = 0; i < config.layers.length; i++) {
			let layer = config.layers[i];
			if (layer.visible == false)
				continue;

			trim_details_array[layer.id] = this.Image_trim.get_trim_info(layer.id);
		}

		//move layers
		for (let i = 0; i < config.layers.length; i++) {
			let layer = config.layers[i];
			if (layer.visible == false)
				continue;

			let trim_details = trim_details_array[layer.id];
			if (new_width == trim_details.left) {
				//empty layer
				continue;
			}
			let width = new_width - trim_details.left - trim_details.right;
			let height = config.HEIGHT - trim_details.top - trim_details.bottom;

			if (xx + width > new_width) {
				xx = 0;
				yy += max_height;
				max_height = 0;
			}
			if (yy % gap > 0 && gap > 0) {
				yy = yy - yy % gap + gap;
			}
			if (yy + height > new_height) {
				new_height = yy + height;
				this.Base_gui.prepare_canvas();
			}

			actions.push(
				new app.Actions.Update_layer_action(layer.id, {
					x: layer.x + xx - trim_details.left,
					y: layer.y + yy - trim_details.top
				} as unknown as Layer)
			);

			xx += width;
			if (gap > 0) {
				xx = xx - xx % gap + gap;
			}

			if (height > max_height) {
				max_height = height;
			}
			if (xx > new_width) {
				xx = 0;
				yy += max_height;
				max_height = 0;
			}
		}
		actions.push(
			new app.Actions.Prepare_canvas_action("undo"),
			new app.Actions.Update_config_action({
				WIDTH: new_width,
				HEIGHT: new_height
			}),
			new app.Actions.Prepare_canvas_action("do")
		);

		app.State?.do_action(
			new app.Actions.Bundle_action("sprites", "Sprites", actions)
		);

	}

}

export default Tools_sprites_class;