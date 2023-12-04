import app from "../app.js";
import config from "../config.js";
import Base_tools_class from "../core/base-tools.js";
import Base_layers_class from "../core/base-layers.js";
import alertify from "alertifyjs/build/alertify.min.js";
import glfx from "../libs/glfx.js";
import Helper_class from "../libs/helpers.js";

class BulgePinch_class extends Base_tools_class {
	fx_filter: boolean;
	ctx: CanvasRenderingContext2D;
	tmpCanvas: null | HTMLCanvasElement;
	tmpCanvasCtx: null | CanvasRenderingContext2D;
	started: boolean;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = "bulge_pinch";
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
		this.started = false;
	}

	load() {
		this.default_events();
	}

	default_dragMove(event: MouseEvent) {
		if (config.TOOL.name != this.name)
			return;

		//mouse cursor
		let mouse = this.get_mouse_info(event);
		let params = this.getParams();
		this.show_mouse_cursor(mouse.x, mouse.y, params.radius, "circle");
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
		this.started = true;

		//get canvas from layer
    this.tmpCanvas = document.createElement("canvas");
		this.tmpCanvasCtx = this.tmpCanvas.getContext("2d");
		this.tmpCanvas.width = config.layer.width_original;
		this.tmpCanvas.height = config.layer.height_original;
        if (config.layer.link_canvas != undefined) {

		        this.tmpCanvasCtx.drawImage(config.layer.link, 0, 0);
        }

		//apply
		this.bulgePinch_general(mouse, params.power, params.radius, params.bulge);

		//register tmp canvas for faster redraw
		config.layer.link_canvas = this.tmpCanvas;
		config.need_render = true;
	}

	mouseup(e: MouseEvent) {
		if (this.started == false) {
			return;
		}
		delete config.layer.link_canvas;

		app.State?.do_action(
			new app.Actions.Bundle_action("bulge_pinch_tool", "Bulge/Pinch Tool", [
				new app.Actions.Update_layer_image_action(this.tmpCanvas)
			])
		);

		//decrease memory
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

	bulgePinch_general(mouse: MouseEvent | null, power: string | number | boolean | object, radius: string | number | boolean | object, bulge: string | number | boolean | object) {
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		let ctx = this.tmpCanvasCtx;
		let mouse_x = Math.round(mouse.x) - config.layer.x;
		let mouse_y = Math.round(mouse.y) - config.layer.y;

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, "width");
		mouse_y = this.adaptSize(mouse_y, "height");

		//convert float coords to integers
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);

		power = power / 100;
		if (power > 1) {
			//max 100%
			power = 1;
		}

		if (bulge == false)
			power = -1 * power;

		let texture = this.fx_filter.texture(this.tmpCanvas);
		this.fx_filter.draw(texture).bulgePinch(mouse_x, mouse_y, radius, power).update();	//effect
		this.tmpCanvasCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
		this.tmpCanvasCtx.drawImage(this.fx_filter, 0, 0);
	}

}
export default BulgePinch_class;
