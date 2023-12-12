import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";
import ImageFilters from "../../libs/imagefilters";

class Effects_mosaic_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	mosaic() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		const settings = {
			title: "Mosaic",
			preview: true,
			effects: true,
			params: [
				{name: "size", title: "Size:", value: 10, range: [1, 100]},
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
		this.POP.show(settings as any);
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

	change(data: ImageData, params: { size: any; }) {
		let size = parseFloat(params.size);

		//convert % to px
		size = Math.min(data.width, data.height) * size / 100;
		size = Math.round(size);

		let filtered = ImageFilters.Mosaic(data, size);

		return filtered;
	}

	demo(canvas_id: string, canvas_thumb: HTMLCanvasElement){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.drawImage(canvas_thumb, 0, 0);

		//now update
		let img = ctx.getImageData(0, 0, canvas_thumb.width, canvas_thumb.height);
		let params = {
			size: 10,
		};
		let data = this.change(img, params);
		ctx.putImageData(data, 0, 0);
	}

}

export default Effects_mosaic_class;