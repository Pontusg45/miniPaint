import app from "../../app.js";
import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";
import Tools_settings_class from "../tools/settings.js";
import Helper_class from "../../libs/helpers.js";

class Image_translate_class {
	POP: Dialog_class;
	Tools_settings: Tools_settings_class;
	Helper: Helper_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Tools_settings = new Tools_settings_class();
		this.Helper = new Helper_class();
	}

	translate() {
		let _this = this;
		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		let pos_x = this.Helper.get_user_unit(config.layer.x, units, resolution);
		let pos_y = this.Helper.get_user_unit(config.layer.y, units, resolution);

		let settings = {
			title: "Translate",
			params: [
				{name: "x", title: "X position:", value: pos_x},
				{name: "y", title: "Y position:", value: pos_y},
			],
			on_finish: function (params) {
				let pos_x = _this.Helper.get_internal_unit(params.x, units, resolution);
				let pos_y = _this.Helper.get_internal_unit(params.y, units, resolution);

				app.State?.do_action(
					new app.Actions.Bundle_action("translate_layer", "Translate Layer", [
						new app.Actions.Update_layer_action(config.layer.id, {
							x: pos_x,
							y: pos_y,
						})
					])
				);
			},
		};
		this.POP.show(settings);
	}
}

export default Image_translate_class;
