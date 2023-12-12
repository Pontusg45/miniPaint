import { DialogConfig } from "../../../../types/types";
import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";

class Tools_restoreAlpha_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	restore_alpha() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Restore Alpha",
			preview: true,
			on_change: function (params: { level: any; }, canvas_preview: { getImageData: (arg0: number, arg1: number, arg2: any, arg3: any) => any; putImageData: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any) {
				let img = canvas_preview.getImageData(0, 0, w, h);
				let data = _this.recover_alpha(img, params.level);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "level", title: "Level:", value: "128", range: [0, 255]},
			],
			on_finish: function (params: { level: any; }) {
				_this.save_alpha(params.level);
			},
		};
		this.POP.show(settings as any);
	}

	save_alpha(level: any) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.recover_alpha(img, level);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	recover_alpha(data: ImageData, level:  number) {
		let imgData = data.data;
		let tmp;
		for (let i = 0; i < imgData.length; i += 4) {
			tmp = imgData[i + 3] + level;
			if (tmp > 255) {
				tmp = 255;
			}
			imgData[i + 3] = tmp;
		}
		return data;
	}

}

export default Tools_restoreAlpha_class;