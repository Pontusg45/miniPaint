// @ts-nocheck
import config from "../../config";
import Helper_class from "../../libs/helpers";
import Base_gui_class from "../../core/base-gui";
import Base_layers_class from "../../core/base-layers";
import Tools_settings_class from "../tools/settings";

let instance = null;

class View_ruler_class {
	GUI: Base_gui_class;
	Base_layers: Base_layers_class;
	Tools_settings: Tools_settings_class;
	Helper: Helper_class;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.GUI = new Base_gui_class();
		this.Base_layers = new Base_layers_class();
		this.Tools_settings = new Tools_settings_class();
		this.Helper = new Helper_class();

		this.set_events();
	}

	set_events() {
		let _this = this;

		window.addEventListener("resize", function (event) {
			//resize
			_this.prepare_ruler();
			_this.render_ruler();
		}, false);
		document.addEventListener("keydown", (event) => {
			let code = event.code;
			if (this.Helper.is_input(event.target))
				return;

			if (event.code == "KeyU" && event.ctrlKey != true && event.metaKey != true) {
				_this.ruler();
				event.preventDefault();
			}
		}, false);
	}

	ruler() {
		let ruler_left = document.getElementById("ruler_left");
		let ruler_top = document.getElementById("ruler_top");
		let middle_area = document.getElementById("middle_area");

		if(config.ruler_active == false){
			//activate
			config.ruler_active = true;
			document.getElementById("middle_area").classList.add("has-ruler");
			ruler_left.style.display = "block";
			ruler_top.style.display = "block";

			this.prepare_ruler();
			this.render_ruler();
		}
		else{
			//deactivate
			config.ruler_active = false;
			document.getElementById("middle_area").classList.remove("has-ruler");
			ruler_left.style.display = "none";
			ruler_top.style.display = "none";
		}

		this.GUI.prepare_canvas();

		config.need_render = true;
	}

	prepare_ruler(){
		if(config.ruler_active == false)
			return;

		let ruler_left = document.getElementById("ruler_left");
		let ruler_top = document.getElementById("ruler_top");
		let middle_area = document.getElementById("middle_area");

		let middle_area_width = middle_area.clientWidth;
		let middle_area_height = middle_area.clientHeight;

		ruler_left.width = 15;
		ruler_left.height = middle_area_height - 20;

		ruler_top.width = middle_area_width - 20;
		ruler_top.height = 15;
	}

	render_ruler(){
		if(config.ruler_active == false)
			return;

		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		let ruler_left = document.getElementById("ruler_left");
		let ruler_top = document.getElementById("ruler_top");

		let ctx_left = ruler_left.getContext("2d");
		let ctx_top = ruler_top.getContext("2d");

		let color = "#111";
		let size = 15;

		//calc step
		let step = Math.ceil(10 * config.ZOOM);
		while (step < 5) {
			step = step * 2;
		}
		while (step > 10) {
			step = Math.ceil(step / 2);
		}
		let step_big = step * 10;

		//calc begin/end point
		let begin_x = Math.max(0, ruler_top.width / 2 - config.WIDTH * config.ZOOM / 2);
		let begin_y = Math.max(0, ruler_left.height / 2 - config.HEIGHT * config.ZOOM / 2);

		let end_x = Math.min(ruler_top.width, ruler_top.width / 2 + config.WIDTH * config.ZOOM / 2);
		let end_y = Math.min(ruler_left.height, ruler_left.height / 2 + config.HEIGHT * config.ZOOM / 2);

		//left
		ctx_left.strokeStyle = color;
		ctx_left.lineWidth = 1;
		ctx_left.font = "11px Arial";

		ctx_left.clearRect(0, 0, ruler_left.width, ruler_left.height);

		ctx_left.beginPath();
		for (let i = begin_y; i < end_y; i += step) {
			ctx_left.moveTo(10, i + 0.5);
			ctx_left.lineTo(size, i + 0.5);
		}
		ctx_left.stroke();

		ctx_left.beginPath();
		for (let i = begin_y; i <= end_y; i += step_big) {
			ctx_left.moveTo(0, i + 0.5);
			ctx_left.lineTo(size, i + 0.5);

			let global_pos = this.Base_layers.get_world_coords(0, i - begin_y);
			let value = this.Helper.get_user_unit(global_pos.y, units, resolution);

			if(units == "inches"){
				//more decimals value
				let text = this.Helper.number_format(value, 1);
			}
			else{
				let text = Math.ceil(value);
			}
			text = text.toString();

			//text
			for (let j = 0; j < text.length; j++) {
				let letter = text.charAt(j);
				let line_height = 10;
				ctx_left.fillText(letter, 1, i + 11 + j * line_height);
			}
		}
		ctx_left.stroke();

		//top
		ctx_top.strokeStyle = color;
		ctx_top.lineWidth = 1;
		ctx_top.font = "11px Arial";

		ctx_top.clearRect(0, 0, ruler_top.width, ruler_top.height);

		ctx_top.beginPath();
		for (let i = begin_x; i < end_x; i += step) {
			let y = (i / step_big == parseInt(i / step_big)) ? 0 : step;
			ctx_top.moveTo(i + 0.5, 10);
			ctx_top.lineTo(i + 0.5, size);
		}
		ctx_top.stroke();

		ctx_top.beginPath();
		for (let i = begin_x; i <= end_x; i += step_big) {
			ctx_top.moveTo(i + 0.5, 0);
			ctx_top.lineTo(i + 0.5, size);

			let global_pos = this.Base_layers.get_world_coords(i - begin_x, 0);
			let value = this.Helper.get_user_unit(global_pos.x, units, resolution);

			if(units == "inches"){
				//more decimals value
				let text = this.Helper.number_format(value, 1);
			}
			else{
				let text = Math.ceil(value);
			}
			text = text.toString();

			//text
			ctx_top.fillText(text, i + 3, 9);
		}
		ctx_top.stroke();
	}

}

export default View_ruler_class;
