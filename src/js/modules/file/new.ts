import app from "../../app.js";
import config from "../../config.js";
import Base_gui_class from "../../core/base-gui.js";
import Base_layers_class from "../../core/base-layers.js";
import Helper_class from "../../libs/helpers.js";
import Dialog_class from "../../libs/popup.js";
import Tools_settings_class from "../tools/settings.js";

/** 
 * manages files / new
 * 
 * @author ViliusL
 */
class File_new_class {

	Base_gui: Base_gui_class = new Base_gui_class();
	Base_layers: Base_layers_class = new Base_layers_class();
	POP: Dialog_class = new Dialog_class();
	Helper: Helper_class = new Helper_class();
	Tools_settings: Tools_settings_class = new Tools_settings_class();

	constructor() {
		this.Base_gui = new Base_gui_class();
		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
		this.Tools_settings = new Tools_settings_class();
	}

	new () {
		let _this = this;
		let width = config.WIDTH;
		let height = config.HEIGHT;
		let common_dimensions = this.Base_gui.common_dimensions;
		let resolution_types = ["Custom"];
		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		for (let i in common_dimensions) {
			let value = common_dimensions[i];
			resolution_types.push(`${value[0]  }x${  value[1]  } - ${  value[2]}`);
		}

		let transparency_cookie = this.Helper.getCookie("transparency");
		if (transparency_cookie === null) {
			//default
			transparency_cookie = false;
		}
		if (transparency_cookie) {
			let transparency = true;
		}
		else {
			let transparency = false;
		}

		//convert units
		width = this.Helper.get_user_unit(width, units, resolution);
		height = this.Helper.get_user_unit(height, units, resolution);

		let settings = {
			title: "New file",
			params: [
				{name: "width", title: "Width:", value: width, comment: units},
				{name: "height", title: "Height:", value: height, comment: units},
				{name: "resolution_type", title: "Resolution:", values: resolution_types},
				{name: "layout", title: "Layout:", value: "Custom", values: ["Custom", "Landscape", "Portrait"]},
				{name: "transparency", title: "Transparent:", value: transparency},
			],
			on_finish: function (params: any) {
				_this.new_handler(params);
			},
		};
		this.POP.show(settings);
	}

	async new_handler(response: { width: string; height: string; resolution_type: any; transparency: number; layout: string; }) {
		let width = parseFloat(response.width);
		let height = parseFloat(response.height);
		let resolution_type = response.resolution_type;
		let transparency = response.transparency;
		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		if (resolution_type != "Custom") {
			let dim = resolution_type.split(" ");
			dim = dim[0].split("x");
			width = parseInt(dim[0]);
			height = parseInt(dim[1]);

			if(response.layout == "Portrait"){
				let tmp = width;
				width = height;
				height = tmp;
			}
		}
		else {
			//convert units
			width = this.Helper.get_internal_unit(width, units, resolution);
			height = this.Helper.get_internal_unit(height, units, resolution);
		}
		if (app.State == null || app.Actions == null) {
			//save history
			return;
		}
		
		// Prepare layers		
		app.State?.do_action(
			new app.Actions.Bundle_action("new_file", "New File", [
				new app.Actions.Refresh_action_attributes_action("undo"),
				new app.Actions.Prepare_canvas_action("undo"),
				new app.Actions.Update_config_action({
					TRANSPARENCY: !!transparency,
					WIDTH: width,
					HEIGHT: height,
					ALPHA: 255,
					COLOR: "#008000",
					mouse: {},
					visible_width: null,
					visible_height: null,
					user_fonts: {}
				}),
				new app.Actions.Prepare_canvas_action("do"),
				new app.Actions.Refresh_action_attributes_action("do"),
				new app.Actions.Reset_layers_action(),
				new app.Actions.Init_canvas_zoom_action(),
				new app.Actions.Insert_layer_action({})
			])
		);

		//sleep, lets wait till DOM is finished
		await new Promise(r => setTimeout(r, 10));

		//fit to screen?
		this.Base_gui.GUI_preview.zoom_auto(true);

		// Save transparency
		if (transparency) {
			this.Helper.setCookie("transparency", 1);
		}
		else {
			this.Helper.setCookie("transparency", 0);
		}
	}

}

export default File_new_class;