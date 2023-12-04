import app from "../../app.js";
import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";
import Base_layers_class from "../../core/base-layers.js";
import ImageFilters from "../../libs/imagefilters.js";

class Effects_boxBlur_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	box_blur() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Box blur",
			preview: true,
			effects: true,
			params: [
				{name: "param1", title: "H Radius:", value: 3, range: [1, 20]},
				{name: "param2", title: "V Radius:", value: 3, range: [1, 20]},
				{name: "param3", title: "Quality:", value: 3, range: [1, 20]},
			],
			on_change: function (params: any, canvas_preview: { getImageData: (arg0: number, arg1: number, arg2: any, arg3: any) => any; putImageData: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any) {
				let img = canvas_preview.getImageData(0, 0, w, h);
				let data = _this.change(img, params);
				canvas_preview.putImageData(data, 0, 0);
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
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.change(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(data: ImageData, params: { param1: any; param2: any; param3: any; }) {
		let param1 = params.param1;
		let param2 = params.param2;
		let param3 = params.param3;

		let filtered = ImageFilters.BoxBlur(data, param1, param2, param3);

		return filtered;
	}

	demo(canvas_id: string, canvas_thumb: HTMLCanvasElement){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.drawImage(canvas_thumb, 0, 0);

		//now update
		let img = ctx.getImageData(0, 0, canvas_thumb.width, canvas_thumb.height);
		let params = {
			param1: 20,
			param2: 1,
			param3: 1,
		};
		let data = this.change(img, params);
		ctx.putImageData(data, 0, 0);
	}

}

export default Effects_boxBlur_class;