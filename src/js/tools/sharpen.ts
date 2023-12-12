import app from "../app";
import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";
import ImageFilters from "../libs/imagefilters";
import Helper_class from "../libs/helpers";

class Sharpen_class extends Base_tools_class {
	private ctx: CanvasRenderingContext2D;
	private tmpCanvas!: HTMLCanvasElement | null;
	private tmpCanvasCtx!: CanvasRenderingContext2D | null;
	private started: boolean;

	/**
	 * @param {any} ctx
	 */
	constructor(ctx: CanvasRenderingContext2D) {
		super(true);
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = "sharpen";
		this.started = false;
	}

	load() {
		this.default_events();
	}

	default_dragMove(event: MouseEvent) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);

		//mouse cursor
		let mouse = this.get_mouse_info(event);
		if (mouse == null) {
			alert("mouse is null");
			return;
		}
		const params = this.getParams();
		if (params == null) {
			alert("params is null");
			return;
		}
		this.show_mouse_cursor(mouse.x, mouse.y, Object.keys(params).length as number, "circle");
	}

	mousedown(e: MouseEvent) {
		this.started = false;
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alert("Erase on rotate object is disabled. Please rasterize first.");
			return;
		}
		this.started = true;

		//get canvas from layer
		this.tmpCanvas = document.createElement("canvas");
		this.tmpCanvasCtx = this.tmpCanvas.getContext("2d") as CanvasRenderingContext2D;
		this.tmpCanvas.width = config.layer.width_original as number;
		this.tmpCanvas.height = config.layer.height_original;
		this.tmpCanvasCtx?.drawImage(config.layer.link as CanvasImageSource, 0, 0);

		//do sharpen
		this.sharpen_general("click", mouse, params.size as number);

		//register tmp canvas for faster redraw
		config.layer.link_canvas = this.tmpCanvas;
		config.need_render = true;
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (this.started == false) {
			return;
		}

		//do sharpen
		this.sharpen_general("move", mouse, params.size as number);

		//draw draft preview
		config.need_render = true;
	}

	mouseup(e: MouseEvent) {
		if (this.started == false) {
			return;
		}
		delete config.layer.link_canvas;

		if (this.tmpCanvas == null || this.tmpCanvasCtx == null)
			return;

		app.State?.do_action(
			new app.Actions.Bundle_action("sharpen_tool", "Sharpen Tool", [
				new app.Actions.Update_layer_image_action(this.tmpCanvas)
			])
		);

		//decrease memory
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

	sharpen_general(type: string, mouse: MouseEvent, size: number) {
		let ctx = this.tmpCanvasCtx as CanvasRenderingContext2D;
		let mouse_x = Math.round(mouse.x) - config.layer.x;
		let mouse_y = Math.round(mouse.y) - config.layer.y;

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, "width");
		mouse_y = this.adaptSize(mouse_y, "height");
		let size_w = this.adaptSize(size, "width");
		let size_h = this.adaptSize(size, "height");

		//find center
		let center_x = mouse_x - Math.round(size_w / 2);
		let center_y = mouse_y - Math.round(size_h / 2);

		//convert float coords to integers
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);
		center_x = Math.round(center_x);
		center_y = Math.round(center_y);

		let power = 0.5;
		if (type == "move") {
			power = power / 10;
		}

		let imageData = ctx.getImageData(center_x, center_y, size_w, size_h);
		let filtered = ImageFilters.Sharpen(imageData, power); //add effect
		this.Helper.image_round(ctx, mouse_x, mouse_y, size_w, size_h, filtered);
	}

}
export default Sharpen_class;
