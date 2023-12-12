import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";
import Helper_class from "../../libs/helpers";
import { DialogConfig } from "../../../../types/types";

class Tools_replaceColor_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Helper: Helper_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	replace_color() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Replace color",
			preview: true,
			on_change: function (params: any, canvas_preview: { getImageData: (arg0: number, arg1: number, arg2: any, arg3: any) => any; putImageData: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any) {
				let img = canvas_preview.getImageData(0, 0, w, h);
				let data = _this.do_replace(img, params);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "target", title: "Target:", value: config.COLOR, type: "color"},
				{name: "replacement", title: "Replacement:", value: "#ff0000", type: "color"},
				{name: "power", title: "Power:", value: "20", range: [0, 255]},
				{name: "alpha", title: "Alpha:", value: "255", range: [0, 255]},
				{name: "mode", title: "Mode:", values: ["Advanced", "Simple"]},
			],
			on_finish: function (params: any) {
				_this.save_alpha(params);
			},
		};
		this.POP.show(settings as DialogConfig);
	}

	save_alpha(params: any) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.do_replace(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	do_replace(data: ImageData, params: { target: any; replacement: any; power: any; alpha: any; mode: any; }) {
		let target = params.target;
		let replacement = params.replacement;
		let power = params.power;
		let alpha = params.alpha;
		let mode = params.mode;

		let imgData = data.data;
		let target_rgb = this.Helper.hexToRgb(target);
		let target_hsl = this.Helper.rgbToHsl(target_rgb.r, target_rgb.g, target_rgb.b);
		let target_normalized = this.Helper.hslToRgb(target_hsl.h, target_hsl.s, 0.5);

		let replacement_rgb = this.Helper.hexToRgb(replacement);
		let replacement_hsl = this.Helper.rgbToHsl(replacement_rgb.r, replacement_rgb.g, replacement_rgb.b);

		for (let i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			if (mode == "Simple") {
				//simple replace

				//calculate difference from requested color, and change alpha
				let diff = (Math.abs(imgData[i] - target_rgb.r)
					+ Math.abs(imgData[i + 1] - target_rgb.g)
					+ Math.abs(imgData[i + 2] - target_rgb.b)) / 3;
				if (diff > power)
					continue;

				imgData[i] = replacement_rgb.r;
				imgData[i + 1] = replacement_rgb.g;
				imgData[i + 2] = replacement_rgb.b;
				if (alpha < 255)
					imgData[i + 3] = alpha;
			}
			else {
				//advanced replace using HSL
				
				let hsl = this.Helper.rgbToHsl(imgData[i], imgData[i + 1], imgData[i + 2]);
				let normalized = this.Helper.hslToRgb(hsl.h, hsl.s, 0.5);
				let diff = (Math.abs(normalized.r - target_normalized.r)
					+ Math.abs(normalized.g - target_normalized.g)
					+ Math.abs(normalized.b - target_normalized.b)) / 3;
				if (diff > power)
					continue;

				//change to new color with existing luminance
				const normalized_final = this.Helper.hslToRgb(
					replacement_hsl.h,
					replacement_hsl.s,
					hsl.l * (replacement_hsl.l)
				);

				imgData[i] = normalized_final.r;
				imgData[i + 1] = normalized_final.g;
				imgData[i + 2] = normalized_final.b;
				if (alpha < 255)
					imgData[i + 3] = alpha;
			}
		}
		return data;
	}

}

export default Tools_replaceColor_class;
