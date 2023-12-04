import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";
import Helper_class from "../../libs/helpers.js";
import Base_layers_class from "../../core/base-layers.js";
import Tools_settings_class from "../tools/settings.js";

let instance: Image_information_class | null = null;

class Image_information_class {
	Base_layers: Base_layers_class = new Base_layers_class;
	POP: Dialog_class = new Dialog_class;
	Helper: Helper_class = new Helper_class;
	Tools_settings: Tools_settings_class = new Tools_settings_class;

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
			let code = event.key.toLowerCase();
			if (event.target && this.Helper.is_input(event.target))
				return;

			if (code == "i") {
				this.information();
				event.preventDefault();
			}
		}, false);
	}

	information() {
		let _this = this;
		let pixels = config.WIDTH * config.HEIGHT;
		pixels = this.Helper.number_format(pixels, 0);

		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		let width = this.Helper.get_user_unit(config.WIDTH, units, parseInt(resolution));
		let height = this.Helper.get_user_unit(config.HEIGHT, units, parseInt(resolution));

		let settings = {
			title: "Information",
			params: [
				{title: "Width:", value: `${width  } ${  units}`},
				{title: "Height:", value: `${height  } ${  units}`},
				{title: "Pixels:", value: pixels},
				{title: "Layers:", value: config.layers.length},
				{title: "Unique colors:", value: "..."},
			],
		};
		if(units != "pixels"){
			settings.params[0].value += ` (${  config.WIDTH  } pixels)`;
			settings.params[1].value += ` (${  config.HEIGHT  } pixels)`;
		}

		//exif data
		if (config.layer._exif != undefined) {
			//show exif and general data
			let exif_data = config.layer._exif;

			//show general data
			for (let i in exif_data.general) {
				settings.params.push({title: `${i  }:`, value: exif_data.general[i]});
			}

			//show exif data
			let n = 0;
			for (let i in exif_data.exif) {
				if (i == "undefined")
					continue;
				if (n == 0)
					settings.params.push({title: "==== EXIF ====", value: ""});
				settings.params.push({title: `${i  }:`, value: exif_data.exif[i]});
				n++;
			}
		}

		this.POP.show(settings);

		//calc colors
		setTimeout(function () {
			let colors = _this.unique_colors_count();
			colors = _this.Helper.number_format(colors, 0);
			document.getElementById("pop_data_uniquecolo").innerHTML = colors;
		}, 50);
	}

	unique_colors_count() {
		let method = "v2"; //v1 or v2

		if (config.WIDTH * config.HEIGHT > 20 * 1000 * 1000) {
			return "-";
		}

		let canvas = this.Base_layers.convert_layer_to_canvas();
		let ctx = canvas.getContext("2d");
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let imgData = img.data;

		//v1 - simple, slow
		if (method == "v1") {
			let colors: never[] = [];
			let n = 0;
			for (let i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				let key = `${imgData[i]  }.${  imgData[i + 1]  }.${  imgData[i + 2]}`;
				if (colors[key] == undefined) {
					colors[key] = 1;
					n++;
				}
			}
		}

		//v2 - 30% faster
		else if (method == "v2") {
			let buffer32 = new Uint32Array(imgData.buffer);
			let len = buffer32.length;
			let stats = {};
			let n = 0;

			for (let i = 0; i < len; i++) {
				let key = `${  buffer32[i] & 0xffffff}`;
				if (stats[key] == undefined) {
					stats[key] = 0;
					n++;
				}
			}
		}

		return n;
	}
}

export default Image_information_class;
