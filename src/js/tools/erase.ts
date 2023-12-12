// @ts-nocheck
import app from "../app";
import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";

class Erase_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;
	tmpCanvas: null;
	tmpCanvasCtx: null;
	started: boolean;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = "erase";
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
		this.started = false;
	}

	load() {
		this.default_events();
	}

	default_dragMove(event: MouseEvent, is_touch: undefined) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event, is_touch);

		//mouse cursor
		let mouse = this.get_mouse_info(event);
		let params = this.getParams();
		if (params.circle == true)
			this.show_mouse_cursor(mouse.x, mouse.y, params.size, "circle");
		else
			this.show_mouse_cursor(mouse.x, mouse.y, params.size, "rect");
	}

	on_params_update() {
		let params = this.getParams();
		let strict_element = document.querySelector(".attributes #strict");

		if (params.circle == false) {
			//hide strict controls
			strict_element.style.display = "none";
		}
		else {
			//show strict controls
			strict_element.style.display = "block";
		}
	}

	mousedown(e: MouseEvent) {
		this.started = false;
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (mouse.click_valid == false) {
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
		if (config.layer.rotate || 0 > 0) {
			alert("Erase on rotate object is disabled. Please rasterize first.");
			return;
		}
		this.started = true;

		//get canvas from layer
		this.tmpCanvas = document.createElement("canvas");
		this.tmpCanvasCtx = this.tmpCanvas.getContext("2d");
		this.tmpCanvas.width = config.layer.width_original;
		this.tmpCanvas.height = config.layer.height_original;
		this.tmpCanvasCtx.drawImage(config.layer.link, 0, 0);

		this.tmpCanvasCtx.scale(
			config.layer.width_original / config.layer.width,
			config.layer.height_original / config.layer.height
		);

		//do erase
		this.erase_general(this.tmpCanvasCtx, "click", mouse, params.size, params.strict, params.circle);

		//register tmp canvas for faster redraw
		config.layer.link_canvas = this.tmpCanvas;
		config.need_render = true;
	}

	mousemove(e: MouseEvent, is_touch: undefined) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
			return;
		}
		if (this.started == false) {
			return;
		}
		if (mouse.click_x == mouse.x && mouse.click_y == mouse.y) {
			//same coordinates
			return;
		}

		//do erase
		this.erase_general(this.tmpCanvasCtx, "move", mouse, params.size, params.strict, params.circle, is_touch);

		//draw draft preview
		config.need_render = true;
	}

	mouseup(e: MouseEvent) {
		if (this.started == false) {
			return;
		}
		delete config.layer.link_canvas;

		app.State?.do_action(
			new app.Actions.Bundle_action("erase_tool", "Erase Tool", [
				new app.Actions.Update_layer_image_action(this.tmpCanvas)
			])
		);

		//decrease memory
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

	erase_general(ctx: CanvasRenderingContext2D, type: string, mouse: MouseEvent | null, size: string | number | boolean | object, strict: string | number | boolean | object, is_circle: string | number | boolean | object, is_touch: boolean | undefined) {
		let mouse_x = Math.round(mouse.x) - config.layer.x;
		let mouse_y = Math.round(mouse.y) - config.layer.y;
		let alpha = config.ALPHA;
		let mouse_last_x = parseInt(mouse.last_x) - config.layer.x;
		let mouse_last_y = parseInt(mouse.last_y) - config.layer.y;

		ctx.beginPath();
		ctx.lineWidth = size;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		if (alpha < 255)
			ctx.strokeStyle = `rgba(255, 255, 255, ${  alpha / 255 / 10  })`;
		else
			ctx.strokeStyle = "rgba(255, 255, 255, 1)";

		if (is_circle == false) {
			//rectangle
			let size_half = Math.ceil(size / 2);
			if (size == 1) {
				//single cell mode
				mouse_x = Math.floor(mouse.x) - config.layer.x;
				mouse_y = Math.floor(mouse.y) - config.layer.y;
				size_half = 0;
			}
			ctx.save();
			ctx.globalCompositeOperation = "destination-out";
			ctx.fillStyle = `rgba(255, 255, 255, ${  alpha / 255  })`;
			ctx.fillRect(mouse_x - size_half, mouse_y - size_half, size, size);
			ctx.restore();
		}
		else {
			//circle
			ctx.save();

			if (strict == false) {
				let radgrad = ctx.createRadialGradient(
					mouse_x, mouse_y, size / 8,
					mouse_x, mouse_y, size / 2);
				if (type == "click")
					radgrad.addColorStop(0, `rgba(255, 255, 255, ${  alpha / 255  })`);
				else if (type == "move")
					radgrad.addColorStop(0, `rgba(255, 255, 255, ${  alpha / 255 / 2  })`);
				radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");
			}

			//set Composite
			ctx.globalCompositeOperation = "destination-out";
			if (strict == true)
				ctx.fillStyle = `rgba(255, 255, 255, ${  alpha / 255  })`;
			else
				ctx.fillStyle = radgrad;
			ctx.beginPath();
			ctx.arc(mouse_x, mouse_y, size / 2, 0, Math.PI * 2, true);
			ctx.fill();
			ctx.restore();
		}

		//extra work if mouse moving fast - fill gaps
		if (type == "move" && is_circle == true && mouse_last_x != false && mouse_last_y != false && is_touch !== true) {
			ctx.save();
			ctx.globalCompositeOperation = "destination-out";

			ctx.beginPath();
			ctx.moveTo(mouse_last_x, mouse_last_y);
			ctx.lineTo(mouse_x, mouse_y);
			ctx.stroke();

			ctx.restore();
		}
	}

}
export default Erase_class;
