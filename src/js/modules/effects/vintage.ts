import app from "../../app.js";
import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";
import Base_layers_class from "../../core/base-layers.js";
import Vintage_class from "../../libs/vintage.js";

class Effects_vintage_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Vintage: Vintage_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Vintage = new Vintage_class(config.WIDTH, config.HEIGHT);
	}

	vintage() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		this.Vintage.reset_random_values(config.WIDTH, config.HEIGHT);

		let settings = {
			title: "Vintage",
			preview: true,
			effects: true,
			params: [
				{name: "level", title: "Level:", value: 50, range: [0, 100]},
			],
			on_change: function (params: any, canvas_preview: any, w: any, h: any, canvas_: any) {
				_this.change(canvas_, params);
			},
			on_finish: function (params: any) {
				_this.save(params);
			},
		};
		this.POP.show(settings);
	}

	save(params: any) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		let ctx = canvas.getContext("2d");

		//change data
		this.change(canvas, params);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas: HTMLElement | null, params: { level: any; }) {
		let level = parseInt(params.level);

		this.Vintage.apply_all(canvas, level);
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id);
		let ctx = canvas.getContext("2d");
		ctx.drawImage(canvas_thumb, 0, 0);

		//now update
		let params = {
			level: 50,
		};
		this.change(canvas, params);
	}

}

export default Effects_vintage_class;