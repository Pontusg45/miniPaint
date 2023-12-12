import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";
import Helper_class from "../../libs/helpers";

class Tools_colorToAlpha_class {
	private POP: Dialog_class;
	private Base_layers: Base_layers_class;
	private Helper: Helper_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	color_to_alpha() {
		let _this = this;

		if (config.layer?.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		const settings = {
			title: "Color to Alpha",
			preview: true,
			on_change: (params: { color: string; }, canvas_preview: { getImageData: (arg0: number, arg1: number, arg2: number, arg3: number) => ImageData; putImageData: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any) => {
				const img = canvas_preview.getImageData(0, 0, w, h);
				const data = this.change(img, params.color);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{ name: "color", title: "Color:", value: config.COLOR, type: "color" },
			],
			on_finish: (params: { color: any; }) => {
				void this.apply_affect(params.color);
			},
		};
		this.POP.show(settings as any);
	}

	apply_affect(color: string) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.change(img, color);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(data: ImageData, color: string) {
		let imgData = data.data;
		let back_color = this.Helper.hexToRgb(color);

		for (let i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			//calculate difference from requested color, and change alpha
			let diff = Math.abs(imgData[i] - back_color.r) + Math.abs(imgData[i + 1] - back_color.g) + Math.abs(imgData[i + 2] - back_color.b) / 3;
			imgData[i + 3] = Math.round(diff);

			//combining 2 layers in future will change colors, so make changes to get same colors in final image
			//color_result = color_1 * (alpha_1 / 255) * (1 - A2 / 255) + color_2 * (alpha_2 / 255)
			//color_2 = (color_result - color_1 * (alpha_1 / 255) * (1 - A2 / 255)) / (alpha_2 / 255)
			imgData[i] = Math.ceil((imgData[i] - back_color.r * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
			imgData[i + 1] = Math.ceil((imgData[i + 1] - back_color.g * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
			imgData[i + 2] = Math.ceil((imgData[i + 2] - back_color.b * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
		}
		return data;
	}

}

export default Tools_colorToAlpha_class;