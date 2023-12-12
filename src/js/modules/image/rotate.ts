import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";
import Base_gui_class from "../../core/base-gui";
import Helper_class from "../../libs/helpers";
import app from "../../app";

let instance: Image_rotate_class | null = null;

class Image_rotate_class {
	Base_layers = new Base_layers_class;
	Base_gui = new Base_gui_class;
	Helper = new Helper_class;
	Dialog = new Dialog_class;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.set_events();
	}

	set_events() {
		document.addEventListener("keydown", (event) => {
			let code = event.keyCode;
			if (this.Helper.is_input(event.target as HTMLInputElement))
				return;

			if (code == 76) {
				//L - rotate left
				this.left();
				event.preventDefault();
			}
		}, false);
	}

	rotate() {
		let _this = this;

		if (config.layer.rotate === null) {
			alert("Rotate is not supported on this type of object. Convert to raster?");
			return;
		}

		let angles = ["Custom", "0", "90", "180", "270"];
		let initial_angle = config.layer.rotate;

		let settings = {
			title: "Rotate",
			params: [
				{name: "rotate", title: "Rotate:", value: config.layer.rotate, range: [0, 360]},
				{name: "right_angle", title: "Right angle:", values: angles},
			],
			on_change: function (params: any, canvas_preview: any, w: any, h: any) {
				_this.rotate_handler(params, false);
			},
			on_finish: function (params: any) {
				config.layer.rotate = initial_angle;
				_this.rotate_handler(params);
			},
			on_cancel: function (params: any) {
				config.layer.rotate = initial_angle;
				config.need_render = true;
			},
		};
		this.Dialog.show(settings as any);
	}

	rotate_handler(data: { rotate: string; right_angle: string; }, can_resize = true) {
		let value = parseInt(data.rotate);
		if (data.right_angle != "Custom") {
			value = parseInt(data.right_angle);
		}

		if (value < 0)
			value = 360 + value;
		if (value >= 360)
			value = value - 360;
		let new_rotate = value;

		if (can_resize == true) {
			app.State?.do_action(
				new app.Actions.Bundle_action("rotate_layer", "Rotate Layer", [
					new app.Actions.Update_layer_action(config.layer.id, {
						rotate: new_rotate
					} as any),
					...this.check_sizes(new_rotate)
				])
			);
		} else {
			config.layer.rotate = new_rotate;
			config.need_render = true;
		}
	}

	left() {
		let new_rotate = config.layer.rotate;
		new_rotate -= 90;
		if (new_rotate < 0)
			new_rotate = 360 + new_rotate;

		app.State?.do_action(
			new app.Actions.Bundle_action("rotate_layer", "Rotate Layer", [
				new app.Actions.Update_layer_action(config.layer.id, {
					rotate: new_rotate
				} as any),
				...this.check_sizes(new_rotate)
			])
		);
	}

	right() {
		let new_rotate = config.layer.rotate;
		new_rotate += 90;
		if (new_rotate >= 360)
			new_rotate = new_rotate - 360;

		app.State?.do_action(
			new app.Actions.Bundle_action("rotate_layer", "Rotate Layer", [
				new app.Actions.Update_layer_action(config.layer.id, {
					rotate: new_rotate
				} as any),
				...this.check_sizes(new_rotate)
			])
		);
	}

	/**
	 * Makes sure image fits all after rotation
	 * @returns {array} actions to perform
	 */
	check_sizes(new_rotate: number) {
		let actions = [];
		let w = config.layer.width;
		let h = config.layer.height;

		let o = new_rotate * Math.PI / 180;
		let new_x = w * Math.abs(Math.cos(o)) + h * Math.abs(Math.sin(o));
		let new_y = w * Math.abs(Math.sin(o)) + h * Math.abs(Math.cos(o));

		//round values
		new_x = Math.ceil(Math.round(new_x * 1000) / 1000);
		new_y = Math.ceil(Math.round(new_y * 1000) / 1000);

		if (new_x > config.WIDTH || new_y > config.HEIGHT) {
			let dx = 0;
			let dy = 0;
			let new_width = config.WIDTH;
			let new_height = config.HEIGHT;
			if (new_x > config.WIDTH) {
				dx = Math.ceil(new_x - new_width) / 2;
				new_width = new_x;
			}
			if (new_y > config.HEIGHT) {
				dy = Math.ceil(new_y - new_height) / 2;
				new_height = new_y;
			}
			actions.push(
				new app.Actions.Prepare_canvas_action("undo"),
				new app.Actions.Update_layer_action(config.layer.id, {
					x: config.layer.x + dx,
					y: config.layer.y + dy
				} as any),
				new app.Actions.Update_config_action({
					WIDTH: new_width,
					HEIGHT: new_height
				}),
				new app.Actions.Prepare_canvas_action("do")
			);
		}
		return actions;
	}
}

export default Image_rotate_class;