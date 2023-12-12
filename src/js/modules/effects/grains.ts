import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";
import Helper_class from "../../libs/helpers";

class Effects_grains_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Helper: Helper_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	grains() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Grains",
			preview: true,
			effects: true,
			params: [
				{name: "level", title: "Level:", value: "30", range: [0, 50]},
			],
			on_change: function (params: any, canvas_preview: CanvasRenderingContext2D, w: any, h: any) {
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

	change(data: ImageData, params: { level: any; }) {
		if (params.level == 0)
			return data;
		let imgData = data.data;

		let H = data.height;
		let W = data.width;

		for (let j = 0; j < H; j++) {
			for (let i = 0; i < W; i++) {
				let x = (i + j * W) * 4;
				if (imgData[x + 3] == 0)
					continue;	//transparent
				//increase it's lightness
				let delta = this.Helper.getRandomInt(0, params.level);
				if (delta == 0)
					continue;

				if (imgData[x] - delta < 0)
					imgData[x] = -(imgData[x] - delta);
				else
					imgData[x] = imgData[x] - delta;
				if (imgData[x + 1] - delta < 0)
					imgData[x + 1] = -(imgData[x + 1] - delta);
				else
					imgData[x + 1] = imgData[x + 1] - delta;
				if (imgData[x + 2] - delta < 0)
					imgData[x + 2] = -(imgData[x + 2] - delta);
				else
					imgData[x + 2] = imgData[x + 2] - delta;
			}
		}

		return data;
	}

	demo(canvas_id: string, canvas_thumb: HTMLCanvasElement){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.drawImage(canvas_thumb, 0, 0);

		//now update
		let img = ctx.getImageData(0, 0, canvas_thumb.width, canvas_thumb.height);
		let params = {
			level: 30,
		};
		let data = this.change(img, params);
		ctx.putImageData(data, 0, 0);
	}

}

export default Effects_grains_class;