/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from "../../config.js";
import Base_layers_class from "../base-layers.js";
import Tools_settings_class from "../../modules/tools/settings.js";
import Helper_class from "../../libs/helpers.js";

const template = `
	<span class="trn label">Size:</span>
	<span id="mouse_info_size">-</span> 
	<span class="id-mouse_info_units"></span>
	<br />
	<span class="trn label">Mouse:</span>
	<span id="mouse_info_mouse">-</span>
	<span class="id-mouse_info_units"></span>
	<br />
	<span class="trn label">Resolution:</span>
	<span id="mouse_info_resolution">-</span>
`;

/**
 * GUI class responsible for rendering information block on right sidebar
 */
class GUI_information_class {
	Base_layers: Base_layers_class;
	Tools_settings: Tools_settings_class;
	Helper: Helper_class;
	last_width = 0;
	last_height = 0;
	units: any;
	resolution: any;

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.Tools_settings = new Tools_settings_class();
		this.Helper = new Helper_class();

		this.units = this.Tools_settings.get_setting("default_units");
		this.resolution = this.Tools_settings.get_setting("resolution");
	}

	render_main_information() {
		(document.getElementById("toggle_info")  as HTMLElement).innerHTML = template;
		this.set_events();
		this.show_size();
	}

	set_events() {
		const _this = this;
		const target = document.getElementById("mouse_info_mouse") as HTMLElement;

		//show width and height
		//should use canvas resize API in future
		document.addEventListener("mousemove", function (e) {
			_this.show_size();
		}, false);

		//show current mouse position
		document.getElementById("canvas_minipaint")?.addEventListener("mousemove", function (e) {
			const global_pos = _this.Base_layers.get_world_coords(e.offsetX, e.offsetY);
			let mouse_x = Math.ceil(global_pos.x);
			let mouse_y = Math.ceil(global_pos.y);

			mouse_x = _this.Helper.get_user_unit(mouse_x, _this.units, _this.resolution);
			mouse_y = _this.Helper.get_user_unit(mouse_y, _this.units, _this.resolution);

			target.innerHTML = `${mouse_x  }, ${  mouse_y}`;
		}, false);
	}

	update_units(){
		this.units = this.Tools_settings.get_setting("default_units");
		this.resolution = this.Tools_settings.get_setting("resolution");
		this.show_size(true);
	}

	show_size(force?: boolean) {
		if(force == undefined && this.last_width == config.WIDTH && this.last_height == config.HEIGHT) {
			return;
		}

		const width = this.Helper.get_user_unit(config.WIDTH, this.units, this.resolution);
		const height = this.Helper.get_user_unit(config.HEIGHT, this.units, this.resolution);

		(document.getElementById("mouse_info_size") as HTMLElement).innerHTML = `${width  } x ${  height}`;

		const resolution = this.Tools_settings.get_setting("resolution");
		(document.getElementById("mouse_info_resolution") as HTMLElement).innerHTML = resolution;

		//show units
		const default_units = this.Tools_settings.get_setting("default_units_short");
		const targets = document.querySelectorAll(".id-mouse_info_units");
		for (let i = 0; i < targets.length; i++) {
			targets[i].innerHTML = default_units;
		}

		this.last_width = config.WIDTH as number;
		this.last_height = config.HEIGHT as number;
	}

}

export default GUI_information_class;
