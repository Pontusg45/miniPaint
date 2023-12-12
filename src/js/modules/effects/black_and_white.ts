import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";
import Helper_class from "../../libs/helpers";

class Effects_backAndWhite_class {
	private POP: Dialog_class;
	private Base_layers: Base_layers_class;
	private Helper: Helper_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	black_and_white() {
		const _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		//create tmp canvas
		const canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//calc default level
		const default_level = this.thresholding(ctx, canvas.width, canvas.height, true);

		const settings = {
			title: "Black and White",
			preview: true,
			effects: true,
			params: [
				{ name: "level", title: "Level:", value: default_level, range: [0, 255] },
				{ name: "dithering", title: "Dithering:", value: false },
			],
			on_change: function (params: { dithering: boolean; }, canvas_preview: { getImageData: (arg0: number, arg1: number, arg2: any, arg3: any) => any; putImageData: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any) {
				//check params
				let level = document.getElementById("pop_data_level");
				if (params.dithering == false) {
					// @ts-ignore
					level.disabled = false;
				}
				else {
					// @ts-ignore
					level.disabled = true;
				}

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
		const canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.change(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(data: ImageData, params: { dithering: any; level?: any; }) {
		let W = data.width;
		let H = data.height;

		//create tmp canvas
		let canvas = document.createElement("canvas");
		canvas.width = W;
		canvas.height = H;

		let imgData = data.data;
		let grey, c, quant_error, m;
		if (params.dithering !== true) {
			//no differing
			for (let i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
				if (grey <= params.level)
					c = 0;
				else
					c = 255;
				imgData[i] = c;
				imgData[i + 1] = c;
				imgData[i + 2] = c;
			}
		}
		else {
			//Floyd–Steinberg dithering
			let img2 = (canvas.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, W, H);
			let imgData2 = img2.data;
			for (let j = 0; j < H; j++) {
				for (let i = 0; i < W; i++) {
					let k = ((j * (W * 4)) + (i * 4));
					if (imgData[k + 3] == 0)
						continue;	//transparent

					grey = Math.round(0.2126 * imgData[k] + 0.7152 * imgData[k + 1] + 0.0722 * imgData[k + 2]);
					grey = grey + imgData2[k]; //add data shft from previous iterations
					c = Math.floor(grey / 256);
					if (c == 1)
						c = 255;
					imgData[k] = c;
					imgData[k + 1] = c;
					imgData[k + 2] = c;
					quant_error = grey - c;
					if (i + 1 < W) {
						m = k + 4;
						imgData2[m] += Math.round(quant_error * 7 / 16);
					}
					if (i - 1 > 0 && j + 1 < H) {
						m = k - 4 + W * 4;
						imgData2[m] += Math.round(quant_error * 3 / 16);
					}
					if (j + 1 < H) {
						m = k + W * 4;
						imgData2[m] += Math.round(quant_error * 5 / 16);
					}
					if (i + 1 < W && j + 1 < H) {
						m = k + 4 + W * 4;
						imgData2[m] += Math.round(quant_error * 1 / 16);
					}
				}
			}
		}
		return data;
	}

	thresholding(ctx: CanvasRenderingContext2D, W: number, H: number, only_level: boolean) {
		let img = ctx.getImageData(0, 0, W, H);
		let imgData = img.data;
		let hist_data = [];
		let grey;
		for (let i = 0; i <= 255; i++)
			hist_data[i] = 0;
		for (let i = 0; i < imgData.length; i += 4) {
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			hist_data[grey]++;
		}
		let level = this.otsu(hist_data, W * H);
		if (only_level === true)
			return level;
		let c;
		for (let i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			if (grey < level)
				c = 0;
			else
				c = 255;
			imgData[i] = c;
			imgData[i + 1] = c;
			imgData[i + 2] = c;
		}
		ctx.putImageData(img, 0, 0);
	}

	//http://en.wikipedia.org/wiki/Otsu%27s_Method
	otsu(histogram: number[], total: number) {
		let sum = 0;
		for (let i = 1; i < 256; ++i)
			sum += i * histogram[i];
		let mB, mF, between;
		let sumB = 0;
		let wB = 0;
		let wF = 0;
		let max = 0;
		let threshold = 0;
		for (let i = 0; i < 256; ++i) {
			wB += histogram[i];
			if (wB == 0)
				continue;
			wF = total - wB;
			if (wF == 0)
				break;
			sumB += i * histogram[i];
			mB = sumB / wB;
			mF = (sum - sumB) / wF;
			between = wB * wF * Math.pow(mB - mF, 2);
			if (between > max) {
				max = between;
				threshold = i;
			}
		}
		return threshold;
	}

	demo(canvas_id: string, canvas_thumb: HTMLCanvasElement) {
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.drawImage(canvas_thumb, 0, 0);

		//now update
		let img = ctx.getImageData(0, 0, canvas_thumb.width, canvas_thumb.height);
		let default_level = this.thresholding(ctx, canvas_thumb.width, canvas_thumb.height, true);
		let params = {
			level: default_level,
			dithering: false,
		};
		let data = this.change(img, params);
		ctx.putImageData(data, 0, 0);
	}

}

export default Effects_backAndWhite_class;