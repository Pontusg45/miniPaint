import app from "../../app.js";
import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";
import Base_layers_class from "../../core/base-layers.js";
import glfx from "../../libs/glfx.js";

class Effects_denoise_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	fx_filter: boolean;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
	}

	denoise() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Denoise",
			preview: true,
			effects: true,
			params: [
				{name: "param1", title: "Exponent:", value: 20, range: [0, 50]},
			],
			on_change: function (params: any, canvas_preview: { clearRect: (arg0: number, arg1: number, arg2: any, arg3: any) => void; drawImage: (arg0: boolean, arg1: number, arg2: number) => void; }, w: any, h: any, canvas_: { width: number; height: number; }) {
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
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let data = this.change(canvas, params);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas: HTMLCanvasElement, params: { param1: any; }) {
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		let param1 = parseFloat(params.param1);

		let texture = this.fx_filter.texture(canvas);
		this.fx_filter.draw(texture).denoise(param1).update();	//effect

		return this.fx_filter;
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//modify
		let params = {
			param1: 20,
		};
		let data = this.change(canvas_thumb, params);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_denoise_class;