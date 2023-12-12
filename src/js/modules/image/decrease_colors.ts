import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";
import Helper_class from "../../libs/helpers";
import ImageFilters_class from "../../libs/imagefilters";
import { ImageFiltersType } from "../../../../types/types";

class Image_decreaseColors_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Helper: Helper_class;
	ImageFilters: ImageFiltersType;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ImageFilters = ImageFilters_class;
	}

	decrease_colors() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Decrease Color Depth",
			preview: true,
			on_change: function (params: { colors: any; greyscale: any; }, canvas_preview: { getImageData: (arg0: number, arg1: number, arg2: any, arg3: any) => any; putImageData: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any) {
				const img = canvas_preview.getImageData(0, 0, w, h);
				const data = _this.get_decreased_data(img, params.colors, params.greyscale);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "colors", title: "Colors:", value: 10, range: [1, 256]},
				{name: "greyscale", title: "Greyscale:", value: false},
			],
			on_finish: function (params: any) {
				_this.execute(params);
			},
		};
		this.POP.show(settings as any);
	}

	execute(params: { colors: any; greyscale: any; }) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.get_decreased_data(img, params.colors, params.greyscale);
		ctx.putImageData(data as any, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	get_decreased_data(data: { data: any; width: number; height: number; }, colors: number | undefined, greyscale: boolean) {
		let img = data.data;
		let imgData = data.data;
		let W = data.width;
		let H = data.height;
		let palette = [];
		let block_size = 10;

		//create tmp canvas
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		canvas.width = W;
		canvas.height = H;

		//collect top colors
		ctx.drawImage(config.layer.link as any, 0, 0, Math.ceil(W / block_size), Math.ceil(H / block_size));
		let img_p = ctx.getImageData(0, 0, Math.ceil(W / block_size), Math.ceil(H / block_size));
		let imgData_p = img_p.data;
		ctx.clearRect(0, 0, W, H);

		for (let i = 0; i < imgData_p.length; i += 4) {
			if (imgData_p[i + 3] == 0)
				continue;	//transparent
			let grey = Math.round(0.2126 * imgData_p[i] + 0.7152 * imgData_p[i + 1]
				+ 0.0722 * imgData_p[i + 2]);
			palette.push([imgData_p[i], imgData_p[i + 1], imgData_p[i + 2], grey]);
		}

		//calculate weights
		let grey_palette = [];
		for (let i = 0; i < 256; i++)
			grey_palette[i] = 0;
		for (let i = 0; i < palette.length; i++)
			grey_palette[palette[i][3]]++;

		if (colors == null)
			throw new Error("colors is null");

		//remove similar colors
		for (let max = 10 * 3; max < 100 * 3; max = max + 10 * 3) {
			if (palette.length <= colors)
				break;
			for (let i = 0; i < palette.length; i++) {
				if (palette.length <= colors)
					break;
				let valid = true;
				for (let j = 0; j < palette.length; j++) {
					if (palette.length <= colors)
						break;
					if (i == j)
						continue;
					if (Math.abs(palette[i][0] - palette[j][0])
						+ Math.abs(palette[i][1] - palette[j][1])
						+ Math.abs(palette[i][2] - palette[j][2]) < max) {
						if (grey_palette[palette[i][3]] > grey_palette[palette[j][3]]) {
							//remove color
							palette.splice(j, 1);
							j--;
						}
						else {
							valid = false;
							break;
						}
					}
				}
				//remove color
				if (valid == false) {
					palette.splice(i, 1);
					i--;
				}
			}
		}
		palette = palette.slice(0, colors);

		//change
		let p_n = palette.length;
		for (let j = 0; j < H; j++) {
			for (let i = 0; i < W; i++) {
				let k = ((j * (W * 4)) + (i * 4));
				if (imgData[k + 3] == 0)
					continue;	//transparent

				//find closest color
				let index1 = 0;
				let min = 999999;
				let diff1;
				for (let m = 0; m < p_n; m++) {
					let diff = Math.abs(palette[m][0] - imgData[k])
						+ Math.abs(palette[m][1] - imgData[k + 1])
						+ Math.abs(palette[m][2] - imgData[k + 2]);
					if (diff < min) {
						min = diff;
						index1 = m;
						diff1 = diff;
					}
				}

				imgData[k] = palette[index1][0];
				imgData[k + 1] = palette[index1][1];
				imgData[k + 2] = palette[index1][2];

				if (greyscale == true) {
					let mid = Math.round(0.2126 * imgData[k] + 0.7152 * imgData[k + 1]
						+ 0.0722 * imgData[k + 2]);
					imgData[k] = mid;
					imgData[k + 1] = mid;
					imgData[k + 2] = mid;
				}
			}
		}

		return data;
	}

}

export default Image_decreaseColors_class;