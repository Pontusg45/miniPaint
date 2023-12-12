// @ts-nocheck
import app from "../app";
import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";
import Layer_raster_class from "../modules/layer/raster";

class Clone_class extends Base_tools_class {
	Layer_raster: Layer_raster_class;
	ctx: CanvasRenderingContext2D;
	tmpCanvas: null;
	tmpCanvasCtx: null;
	started: boolean;
	clone_coords: null;
	pressTimer: null;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Layer_raster = new Layer_raster_class();
		this.ctx = ctx;
		this.name = "clone";
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
		this.started = false;
		this.clone_coords = null;
		this.pressTimer = null;
	}

	load() {
		let _this = this;
		let is_touch = false;

		//mouse events
		document.addEventListener("mousedown", function (event) {
			if(is_touch)
				return;
			_this.dragStart(event);
		});
		document.addEventListener("mousemove", function (event) {
			if(is_touch)
				return;
			_this.dragMove(event);
		});
		document.addEventListener("mouseup", function (event) {
			if(is_touch)
				return;
			_this.dragEnd(event);
		});

		// collect touch events
		document.addEventListener("touchstart", function (event) {
			is_touch = true;
			_this.dragStart(event);
		});
		document.addEventListener("touchmove", function (event) {
			_this.dragMove(event);
		});
		document.addEventListener("touchend", function (event) {
			_this.dragEnd(event);
		});

		document.addEventListener("contextmenu", function (event) {
			_this.mouseRightClick(event);
		});
	}

	dragStart(event: MouseEvent) {
		let _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);

		let mouse = this.get_mouse_info(event);
		if (mouse.click_valid == true) {
			this.pressTimer = window.setTimeout(function() {
				//long press success
				_this.mouseLongClick();
			}, 2000);
		}
	}

	dragMove(event: MouseEvent) {
		let _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousemove(event);

		//mouse cursor
		let mouse = _this.get_mouse_info(event);
		let params = _this.getParams();
		_this.show_mouse_cursor(mouse.x, mouse.y, params.size, "circle");

		clearTimeout(this.pressTimer);
	}

	dragEnd(event: MouseEvent) {
		let _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mouseup(event);

		clearTimeout(this.pressTimer);
	}

	on_params_update() {
		let params = this.getParams();
		let strict_element = document.getElementById("strict");

		if (params.circle == false) {
			//hide strict controls
			strict_element.style.display = "none";
		}
		else {
			//show strict controls
			strict_element.style.display = "block";
		}
	}

	mouseRightClick(e: MouseEvent) {
		if (config.TOOL.name != this.name)
			return;
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();

		if (e.which == 3 && mouse.valid == true) {
			e.preventDefault();
		}
		if (params.source_layer.value == "Previous" && config.layer.type === null) {
			this.Layer_raster.raster();
		}
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alert("Erase on rotate object is disabled. Please rasterize first.");
			return;
		}
		if (e.which == 3 && mouse.valid == true) {
			//right click - save coords

			let mouse_x = this.adaptSize(mouse.x, "width");
			let mouse_y = this.adaptSize(mouse.y, "height");

			this.clone_coords = {
				x: mouse_x,
				y: mouse_y,
			};
			alertify.success("Source coordinates saved.");
		}
	}

	mouseLongClick(){
		let params = this.getParams();
		let mouse = this.get_mouse_info();

		if (params.source_layer.value == "Previous" && config.layer.type === null) {
			this.Layer_raster.raster();
		}
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alert("Erase on rotate object is disabled. Please rasterize first.");
			return;
		}

		let mouse_x = this.adaptSize(mouse.x, "width");
		let mouse_y = this.adaptSize(mouse.y, "height");

		this.clone_coords = {
			x: mouse_x,
			y: mouse_y,
		};
		alertify.success("Source coordinates saved.");
	}

	mousedown(e: MouseEvent) {
		this.started = false;
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		let layer = config.layer;
		let previous_layer = this.Base_layers.find_previous(config.layer.id);

		if (mouse.click_valid == false) {
			return;
		}

		if (params.source_layer.value == "Previous" && config.layer.type === null) {
			this.Layer_raster.raster();
		}
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alert("Erase on rotate object is disabled. Please rasterize first.");
			return;
		}
		if (this.clone_coords === null) {
			alert("Source is empty, right click on image or use long press to save source position.");
			return;
		}
		if (layer.width != layer.width_original || layer.height != layer.height_original) {
			alert("Clone tool disabled for resized image. Please rasterize first.");
			return;
		}
		if (params.source_layer.value == "Previous" &&
			(previous_layer.width != previous_layer.width_original
				|| previous_layer.height != previous_layer.height_original)) {
			alert("Clone tool disabled for resized image. Please rasterize first.");
			return;
		}
		if (params.source_layer.value == "Previous") {
			if (previous_layer == null) {
				alert("Can not find previous layer.");
				return;
			}
			if (previous_layer.type != "image") {
				alert("Previous layer must be image, convert it to raster to apply this tool.");
				return;
			}
		}
		this.started = true;

		//get canvas from layer
		this.tmpCanvas = document.createElement("canvas");
		this.tmpCanvasCtx = this.tmpCanvas.getContext("2d");
		this.tmpCanvas.width = config.layer.width_original;
		this.tmpCanvas.height = config.layer.height_original;
		this.tmpCanvasCtx.drawImage(config.layer.link, 0, 0);

		//clone
		this.clone_general(this.tmpCanvas, this.tmpCanvas, "click", mouse);

		//register tmp canvas for progress redraw
		config.layer.link_canvas = this.tmpCanvas;
		config.need_render = true;
	}

	mousemove(e: MouseEvent) {
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

		//clone
		this.clone_general(this.tmpCanvas, this.tmpCanvas, "move", mouse);

		//draw draft preview
		config.need_render = true;
	}

	mouseup(e: MouseEvent) {
		if (this.started == false) {
			return;
		}
		delete config.layer.link_canvas;

		app.State?.do_action(
			new app.Actions.Bundle_action("clone_tool", "Clone Tool", [
				new app.Actions.Update_layer_image_action(this.tmpCanvas)
			])
		);

		//decrease memory
		this.tmpCanvas.width = 1;
		this.tmpCanvas.height = 1;
		this.tmpCanvas = null;
		this.tmpCanvasCtx = null;
	}

	clone_general(canvas_from: CanvasImageSource | null, canvas_to: { getContext: (arg0: string) => { (): any; new(): any; drawImage: { (arg0: HTMLCanvasElement, arg1: number, arg2: number): void; new(): any; }; }; } | null, type: string, mouse: MouseEvent | null) {
		let params = this.getParams();

		let mouse_x = Math.round(mouse.x) - config.layer.x;
		let mouse_y = Math.round(mouse.y) - config.layer.y;
		let half = Math.round(params.size / 2);

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, "width");
		mouse_y = this.adaptSize(mouse_y, "height");

		//convert float coords to integers
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);

		//create source canvas
		let canvas_source = document.createElement("canvas");
		let ctx_source = canvas_source.getContext("2d");
		let w = Math.ceil(params.size);
		let h = Math.ceil(params.size);
		canvas_source.width = w;
		canvas_source.height = h;

		//add data
		let x_from = Math.round(this.clone_coords.x - (mouse.click_x - mouse_x));
		let y_from = Math.round(this.clone_coords.y - (mouse.click_y - mouse_y));
		if (params.anti_aliasing == false) {
			ctx_source.arc(half, half, half, 0, Math.PI * 2, false);
			ctx_source.clip();
		}
		if (params.source_layer.value == "Previous") {
			let previous_layer = this.Base_layers.find_previous(config.layer.id);

			x_from = Math.round(this.clone_coords.x - (mouse.click_x - mouse_x)) - previous_layer.x + config.layer.x;
			y_from = Math.round(this.clone_coords.y - (mouse.click_y - mouse_y)) - previous_layer.y + config.layer.y;

			ctx_source.drawImage(previous_layer.link, x_from - half, y_from - half, w, h, 0, 0, w, h);
		}
		else {
			ctx_source.drawImage(canvas_from, x_from - half, y_from - half, w, h, 0, 0, w, h);
		}

		//apply anti aliasing
		if (params.anti_aliasing == true) {
			let gradient = ctx_source.createRadialGradient(half, half, 0, half, half, half + 1);
			gradient.addColorStop(0, "white");
			gradient.addColorStop(0.3, "white");
			gradient.addColorStop(1, "transparent");
			ctx_source.fillStyle = gradient;

			ctx_source.globalCompositeOperation = "destination-in";
			ctx_source.fillRect(0, 0, params.size, params.size);
			ctx_source.globalCompositeOperation = "source-over";
		}

		//finish
		canvas_to.getContext("2d").drawImage(canvas_source, mouse_x - half, mouse_y - half);
	}

}
export default Clone_class;
