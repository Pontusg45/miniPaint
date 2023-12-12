import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Tools_settings_class from "../tools/settings";
import Helper_class from "../../libs/helpers";

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
		let units = this.Tools_settings.get_setting("default_units") as string;
		let resolution = this.Tools_settings.get_setting("resolution") as number;

		let pos_x = this.Helper.get_user_unit(config.layer.x, units, resolution);
		let pos_y = this.Helper.get_user_unit(config.layer.y, units, resolution);

		let settings = {
			title: "Translate",
			params: [
				{name: "x", title: "X position:", value: pos_x},
				{name: "y", title: "Y position:", value: pos_y},
			],
			on_finish: function (params: { x: string | number; y: string | number; }) {
				let pos_x = _this.Helper.get_internal_unit(params.x, units, resolution);
				let pos_y = _this.Helper.get_internal_unit(params.y, units, resolution);

				app.State?.do_action(
					new app.Actions.Bundle_action("translate_layer", "Translate Layer", [
						new app.Actions.Update_layer_action(config.layer.id, {
							x: pos_x,
							y: pos_y,
						} as any)
					])
				);
			},
		};
		this.POP.show(settings as any);
	}
}

export default Image_translate_class;
