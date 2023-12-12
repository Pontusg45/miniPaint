import { DialogConfig } from "../../../../types/types";
import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";

class Tools_colorZoom_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	color_zoom() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Color zoom",
			preview: true,
			params: [
				{name: "zoom", title: "Zoom:", value: "2", range: [2, 20], },
				{name: "center", title: "Center:", value: "128", range: [0, 255]},
			],
			on_change: function (params: { zoom: any; center: any; }, canvas_preview: { getImageData: (arg0: number, arg1: number, arg2: any, arg3: any) => any; putImageData: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any) {
				let img = canvas_preview.getImageData(0, 0, w, h);
				let data = _this.change(img, params.zoom, params.center);
				canvas_preview.putImageData(data, 0, 0);
			},
			on_finish: function (params: { zoom: any; center: any; }) {
				_this.save_zoom(params.zoom, params.center);
			},
		} as any;
		this.POP.show(settings as any);
	}

	save_zoom(zoom: any, center: any) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.change(img, zoom, center);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(data: ImageData, zoom: number, center: number) {
		let imgData = data.data;
		let grey;
		for (let i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);

			for (let j = 0; j < 3; j++) {
				let k = i + j;
				if (grey > center)
					imgData[k] += (imgData[k] - center) * zoom;
				else if (grey < center)
					imgData[k] -= (center - imgData[k]) * zoom;
				if (imgData[k] < 0)
					imgData[k] = 0;
				if (imgData[k] > 255)
					imgData[k] = 255;
			}
		}
		return data;
	}

}

export default Tools_colorZoom_class;