// @ts-nocheck
import app from "../app";
import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";

class Magic_erase_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;
	working: boolean;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = "magic_erase";
		this.working = false;
	}

	dragStart(event: MouseEvent) {
		let _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	load() {
		let _this = this;

		//mouse events
		document.addEventListener("mousedown", function (event) {
			_this.dragStart(event);
		});

		// collect touch events
		document.addEventListener("touchstart", function (event) {
			_this.dragStart(event);
		});
	}

	mousedown(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false) {
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alert("Erase on rotate object is disabled. Please rasterize first.");
			return;
		}

		this.magic_erase(mouse);
	}

	async magic_erase(mouse: MouseEvent | null) {
		let params = this.getParams();

		if(this.working == true){
			return;
		}

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}
		if (config.layer.is_vector == true) {
			alert("Layer is vector, convert it to raster to apply this tool.");
			return;
		}

		//get canvas from layer
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		canvas.width = config.layer.width_original;
		canvas.height = config.layer.height_original;
		ctx.drawImage(config.layer.link, 0, 0);

		let mouse_x = Math.round(mouse.x) - config.layer.x;
		let mouse_y = Math.round(mouse.y) - config.layer.y;

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, "width");
		mouse_y = this.adaptSize(mouse_y, "height");

		//convert float coords to integers
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);

		//change
		this.working = true;
		this.magic_erase_general(ctx, config.WIDTH, config.HEIGHT,
			mouse_x, mouse_y, params.power, params.anti_aliasing, params.contiguous);

		app.State?.do_action(
			new app.Actions.Bundle_action("magic_erase_tool", "Magic Eraser Tool", [
				new app.Actions.Update_layer_image_action(canvas)
			])
		);
		//prevent crash bug on touch screen - hard to explain and debug
		await new Promise(r => setTimeout(r, 10));
		this.working = false;
	}

	/**
	 * apply magic erase
	 *
	 * @param {ctx} context
	 * @param {int} W
	 * @param {int} H
	 * @param {int} x
	 * @param {int} y
	 * @param {int} sensitivity max 100
	 * @param {Boolean} anti_aliasing
	 */
	magic_erase_general(context: CanvasRenderingContext2D, W: number, H: number, x: number, y: number, sensitivity: number | boolean | object, anti_aliasing: string | number | boolean | object, contiguous = false) {
		sensitivity = sensitivity * 255 / 100; //convert to 0-255 interval
		x = x;
		y = y;
		let canvasTemp = document.createElement("canvas");
		canvasTemp.width = W;
		canvasTemp.height = H;
		let ctxTemp = canvasTemp.getContext("2d");

		ctxTemp.rect(0, 0, W, H);
		ctxTemp.fillStyle = "rgba(255, 255, 255, 0)";
		ctxTemp.fill();

		let img_tmp = ctxTemp.getImageData(0, 0, W, H);
		let imgData_tmp = img_tmp.data;

		let img = context.getImageData(0, 0, W, H);
		let imgData = img.data;
		let k = ((y * (img.width * 4)) + (x * 4));
		let dx = [0, -1, +1, 0];
		let dy = [-1, 0, 0, +1];
		let color_to = {
			r: 255,
			g: 255,
			b: 255,
			a: 255
		};
		let color_from = {
			r: imgData[k + 0],
			g: imgData[k + 1],
			b: imgData[k + 2],
			a: imgData[k + 3]
		};
		if (color_from.r == color_to.r &&
			color_from.g == color_to.g &&
			color_from.b == color_to.b &&
			color_from.a == 0) {
			return false;
		}
		if (contiguous == false) {
			//check only nearest pixels
			let stack = [];
			stack.push([x, y]);
			while (stack.length > 0) {
				let curPoint = stack.pop();
				for (let i = 0; i < 4; i++) {
					let nextPointX = curPoint[0] + dx[i];
					let nextPointY = curPoint[1] + dy[i];
					if (nextPointX < 0 || nextPointY < 0 || nextPointX >= W || nextPointY >= H)
						continue;
					let k = (nextPointY * W + nextPointX) * 4;
					if (imgData_tmp[k + 3] != 0)
						continue; //already parsed

					if (Math.abs(imgData[k] - color_from.r) <= sensitivity
						&& Math.abs(imgData[k + 1] - color_from.g) <= sensitivity
						&& Math.abs(imgData[k + 2] - color_from.b) <= sensitivity
						&& Math.abs(imgData[k + 3] - color_from.a) <= sensitivity) {
						//erase
						imgData_tmp[k] = color_to.r; //r
						imgData_tmp[k + 1] = color_to.g; //g
						imgData_tmp[k + 2] = color_to.b; //b
						imgData_tmp[k + 3] = color_to.a; //a

						stack.push([nextPointX, nextPointY]);
					}
				}
			}
		}
		else {
			//global mode - contiguous
			for (let i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent

				//imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);

				for (let j = 0; j < 4; j++) {
					let k = i + j;

					if (Math.abs(imgData[k] - color_from.r) <= sensitivity
						&& Math.abs(imgData[k + 1] - color_from.g) <= sensitivity
						&& Math.abs(imgData[k + 2] - color_from.b) <= sensitivity
						&& Math.abs(imgData[k + 3] - color_from.a) <= sensitivity) {
						imgData_tmp[k] = color_to.r; //r
						imgData_tmp[k + 1] = color_to.g; //g
						imgData_tmp[k + 2] = color_to.b; //b
						imgData_tmp[k + 3] = color_to.a; //a
					}
				}
			}
		}

		//destination-out + blur = anti-aliasing
		ctxTemp.putImageData(img_tmp, 0, 0);
		context.globalCompositeOperation = "destination-out";
		if (anti_aliasing == true) {
			context.filter = "blur(1px)";
		}
		context.drawImage(canvasTemp, 0, 0);
	}

}
export default Magic_erase_class;
