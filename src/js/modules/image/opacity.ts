import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";

class Image_opacity_class {
	POP: Dialog_class;

	constructor() {
		this.POP = new Dialog_class();
	}

	opacity() {
		let _this = this;
		let initial_opacity = config.layer.opacity;

		let settings = {
			title: "Opacity",
			params: [
				{name: "opacity", title: "Alpha:", value: config.layer.opacity, range: [0, 100]},
			],
			on_change: function (params: any, canvas_preview: any, w: any, h: any) {
				_this.opacity_handler(params, false);
			},
			on_finish: function (params: any) {
				config.layer.opacity = initial_opacity;
				_this.opacity_handler(params);
			},
			on_cancel: function (params: any) {
				config.layer.opacity = initial_opacity;
				config.need_render = true;
			},
		};
		this.POP.show(settings as any);
	}

	opacity_handler(data: { opacity: string; }, is_final = true) {
		let value = parseInt(data.opacity);
		if (value < 0)
			value = 0;
		if (value > 100)
			value = 100;
		if (is_final) {
			app.State?.do_action(
				new app.Actions.Bundle_action("change_opacity", "Change Opacity", [
					new app.Actions.Update_layer_action(config.layer.id, {
						opacity: value
					} as any)
				])
			);
		} else {
			config.layer.opacity = value;
			config.need_render = true;
		}
	}
}

export default Image_opacity_class;
