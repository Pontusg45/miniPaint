import app from "../../app.js";
import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";
import Base_layers_class from "../../core/base-layers.js";
import glfx from "../../libs/glfx.js";

class Effects_zoomBlur_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	fx_filter: boolean;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
	}

	zoom_blur() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		//get layer size
		let canvas = this.Base_layers.convert_layer_to_canvas(null, true);

		let settings = {
			title: "Zoom blur",
			preview: true,
			effects: true,
			params: [
				{name: "param1", title: "Strength:", value: "0.3", range: [0, 1], step: 0.01},
				{name: "param2", title: "Center x:", value: Math.round(canvas.width / 2), range: [0, canvas.width]},
				{name: "param3", title: "Center y:", value: Math.round(canvas.height / 2), range: [0, canvas.height]},
			],
			on_change: function (params: { param2: number; param3: number; }, canvas_preview: { clearRect: (arg0: number, arg1: number, arg2: any, arg3: any) => void; drawImage: (arg0: boolean, arg1: number, arg2: number) => void; }, w: number, h: number, canvas_: { width: number; height: number; }) {
				//recalc param by size
				params.param2 = params.param2 / canvas.width * w;
				params.param3 = params.param3 / canvas.height * h;

				let data = _this.change(canvas_, params);
				canvas_preview.clearRect(0, 0, canvas_.width, canvas_.height);
				canvas_preview.drawImage(data, 0, 0);
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
		let data = this.change(canvas, params);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas: HTMLCanvasElement, params: { param1: any; param2: any; param3: any; }) {
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		let param1 = parseFloat(params.param1);
		let param2 = parseInt(params.param2);
		let param3 = parseInt(params.param3);

		let texture = this.fx_filter.texture(canvas);
		this.fx_filter.draw(texture).zoomBlur(param2, param3, param1).update();	//effect

		return this.fx_filter;
	}

	demo(canvas_id: string, canvas_thumb: { width: number; height: number; }){
		let canvas = document.getElementById(canvas_id);
		let ctx = canvas.getContext("2d");

		//modify
		let params = {
			param1: 0.3,
			param2: Math.round(canvas_thumb.width / 2),
			param3: Math.round(canvas_thumb.height / 2),
		};
		let data = this.change(canvas_thumb, params);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_zoomBlur_class;