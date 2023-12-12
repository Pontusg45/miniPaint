import app from "../../app.js";
import config from "../../config.js";
import Base_layers_class from "../../core/base-layers.js";
import Dialog_class from "../../libs/popup.js";
import ImageFilters from "../../libs/imagefilters.js";
import Image_trim_class from "../image/trim.js";

class Tools_contentFill_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Image_trim: Image_trim_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Image_trim = new Image_trim_class();
	}

	content_fill() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}
		if (config.layer.x == 0 && config.layer.y == 0 && config.layer.width == config.WIDTH
			&& config.layer.height == config.HEIGHT) {
			alert("Can not use this tool on current layer: image already takes all area.");
			return;
		}

		let settings = {
			title: "Content Fill",
			preview: true,
			on_change: function (params: any, canvas_preview: { clearRect: (arg0: number, arg1: number, arg2: any, arg3: any) => void; drawImage: (arg0: HTMLCanvasElement, arg1: number, arg2: number, arg3: any, arg4: any) => void; }, w: any, h: any, canvasElement: any) {
				canvas_preview.clearRect(0, 0, w, h);

				//create tmp canvas
				let canvas = document.createElement("canvas");
				canvas.width = config.WIDTH;
				canvas.height = config.HEIGHT;

				//change data
				_this.change(canvas, params);

				//add to preview
				canvas_preview.drawImage(canvas, 0, 0, w, h);
			},
			params: [
				{name: "mode", title: "Mode:", values: ["Expand edges", "Cloned edges", "Resized as background"], },
				{name: "blur_power", title: "Blur power:", value: 5, range: [1, 20]},
				{name: "blur_h", title: "Horizontal blur:", value: 5, range: [0, 30]},
				{name: "blur_v", title: "Vertical blur:", value: 5, range: [0, 30]},
				{name: "clone_count", title: "Clone count:", value: 15, range: [10, 50]},
			],
			on_finish: function (params: any) {
				_this.apply_affect(params);
			},
		};
		this.POP.show(settings);
	}

	apply_affect(params: any) {
		//create tmp canvas
		let canvas = document.createElement("canvas");
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;

		//change data
		this.change(canvas, params);

		//save
		return app.State?.do_action(
			new app.Actions.Bundle_action("content_fill", "Content Fill", [
				new app.Actions.Update_layer_action(config.layer.id, {
					x: 0,
					y: 0,
					width: config.WIDTH,
					height: config.HEIGHT
				}),
				new app.Actions.Update_layer_image_action(canvas)
			])
		);
	}

	change(canvas: HTMLCanvasElement, params: { mode: any; blur_power: any; blur_h: any; blur_v: any; clone_count: any; }) {
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		let mode = params.mode;

		//generate background
		if (mode == "Expand edges")
			this.add_edge_background(canvas, params);
		else if (mode == "Resized as background")
			this.add_resized_background(canvas, params);
		else if (mode == "Cloned edges")
			this.add_cloned_background(canvas, params);

		//draw original image
		this.Base_layers.render_object(ctx, config.layer);
	}

	add_edge_background(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, params: { blur_h: any; blur_v: any; blur_power: any; }) {
		let ctx = canvas.getContext("2d");
		let trim_info = this.Image_trim.get_trim_info(config.layer.id);
		let original = this.Base_layers.convert_layer_to_canvas();

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(original, trim_info.left, trim_info.top);

		//draw top
		ctx.drawImage(original,
			0, 0, original.width, 1, //source
			trim_info.left, 0, original.width, trim_info.top); //target

		//bottom
		ctx.drawImage(original,
			0, original.height - 1, original.width, 1,
			trim_info.left, trim_info.top + original.height, original.width, canvas.height);

		//left
		ctx.drawImage(original,
			0, 0, 1, original.height,
			0, trim_info.top, trim_info.left, original.height);

		//right
		ctx.drawImage(original,
			original.width - 1, 0, 1, original.height,
			trim_info.left + original.width, trim_info.top, canvas.width, original.height);

		//fill corners

		//left top
		ctx.drawImage(original,
			0, 0, 1, 1,
			0, 0, trim_info.left, trim_info.top);

		//right top
		ctx.drawImage(original,
			original.width - 1, 0, 1, 1,
			trim_info.left + original.width, 0, canvas.width, trim_info.top);

		//left bottom
		ctx.drawImage(original,
			0, original.height - 1, 1, 1,
			0, trim_info.top + original.height, trim_info.left, trim_info.bottom);

		//right bottom
		ctx.drawImage(original,
			original.width - 1, original.height - 1, 1, 1,
			trim_info.left + original.width, trim_info.top + original.height, trim_info.right, trim_info.bottom);

		//add blur
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let blurred = ImageFilters.BoxBlur(img, params.blur_h, params.blur_v, params.blur_power);
		ctx.putImageData(blurred, 0, 0);
	}

	add_resized_background(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, params: { blur_h: any; blur_v: any; blur_power: any; }) {
		let ctx = canvas.getContext("2d");

		//draw original resized
		let original = this.Base_layers.convert_layer_to_canvas();
		ctx.drawImage(original, 0, 0, canvas.width, canvas.height);

		//add blur
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let blurred = ImageFilters.BoxBlur(img, params.blur_h, params.blur_v, params.blur_power);
		ctx.putImageData(blurred, 0, 0);
	}

	add_cloned_background(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, params: { clone_count: any; blur_h: any; blur_v: any; blur_power: any; }) {
		let blocks = params.clone_count;
		let ctx = canvas.getContext("2d");
		let trim_info = this.Image_trim.get_trim_info(config.layer.id);
		let original = this.Base_layers.convert_layer_to_canvas();

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(original, trim_info.left, trim_info.top);

		//top
		let bsize = Math.ceil(original.width / blocks);
		for (let i = 0; i < original.width; i = i + bsize) {
			for (let j = 0; j < trim_info.top; j = j + bsize) {
				ctx.drawImage(original,
					i, 0, bsize, bsize,
					trim_info.left + i, 0 + j, bsize, bsize);
			}
		}

		//bottom
		bsize = Math.ceil(original.width / blocks);
		for (let i = 0; i < original.width; i = i + bsize) {
			for (let j = 0; j < canvas.height; j = j + bsize) {
				ctx.drawImage(original,
					i, original.height - bsize, bsize, bsize,
					trim_info.left + i, trim_info.top + original.height + j, bsize, bsize);
			}
		}

		//left
		bsize = Math.ceil(original.height / blocks);
		for (let i = 0; i < trim_info.left; i = i + bsize) {
			for (let j = trim_info.top; j < trim_info.top + original.height; j = j + bsize) {
				ctx.drawImage(original,
					0, j - trim_info.top, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//right
		bsize = Math.ceil(original.height / blocks);
		for (let i = trim_info.left + original.width; i < canvas.width; i = i + bsize) {
			for (let j = trim_info.top; j < trim_info.top + original.height; j = j + bsize) {
				ctx.drawImage(original,
					original.width - bsize, j - trim_info.top, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//corners
		bsize = Math.ceil(Math.min(original.width, original.height) / blocks);

		//top left
		for (let i = 0; i < trim_info.left; i = i + bsize) {
			for (let j = 0; j < trim_info.top; j = j + bsize) {
				ctx.drawImage(original,
					0, 0, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//top right
		for (let i = trim_info.left + original.width; i < canvas.width; i = i + bsize) {
			for (let j = 0; j < trim_info.top; j = j + bsize) {
				ctx.drawImage(original,
					original.width - bsize, 0, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//bottom left
		for (let i = 0; i < trim_info.left; i = i + bsize) {
			for (let j = trim_info.top + original.height; j < canvas.height; j = j + bsize) {
				ctx.drawImage(original,
					0, original.height - bsize, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//bottom right
		for (let i = trim_info.left + original.width; i < canvas.width; i = i + bsize) {
			for (let j = trim_info.top + original.height; j < canvas.height; j = j + bsize) {
				ctx.drawImage(original,
					original.width - bsize, original.height - bsize, bsize, bsize,
					i, j, bsize, bsize);
			}
		}


		//add blur
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let blurred = ImageFilters.BoxBlur(img, params.blur_h, params.blur_v, params.blur_power);
		ctx.putImageData(blurred, 0, 0);
	}

}

export default Tools_contentFill_class;