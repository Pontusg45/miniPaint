import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";
import Helper_class from "../libs/helpers";
import Base_gui_class from "../core/base-gui";

class Pick_color_class extends Base_tools_class {
	ctx!: CanvasRenderingContext2D;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.Base_gui = new Base_gui_class();
		this.ctx = ctx;
		this.name = "pick_color";
	}

	dragStart(event: MouseEvent) {
		let _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	dragMove(event: MouseEvent) {
		let _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousemove(event);
	}

	load() {
		let _this = this;

		//mouse events
		document.addEventListener("mousedown", function (event) {
			_this.dragStart(event);
		});
		document.addEventListener("mousemove", function (event) {
			_this.dragMove(event);
		});
		document.addEventListener("mouseup", function (event) {
			let mouse = _this.get_mouse_info(event);
			if (config.TOOL.name != _this.name)
				return;
			_this.copy_color_to_clipboard();
		});

		// collect touch events
		/* document.addEventListener("touchstart", function (event) {
			_this.dragStart(event);
		});
		document.addEventListener("touchmove", function (event) {
			_this.dragMove(event);
		}); */
	}

	mousedown(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);

		this.pick_color(mouse);
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);

		this.pick_color(mouse);
	}

	pick_color(mouse: MouseEvent | null) {
		let params = this.getParams();

		//get canvas from layer
		if (params.global == false) {
			//active layer
			let canvas = this.Base_layers.convert_layer_to_canvas(config.layer.id, undefined, false);
			this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		}
		else {
			//global
			let canvas = document.createElement("canvas");
			this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
			canvas.width = config.WIDTH;
			canvas.height = config.HEIGHT;
			this.Base_layers.convert_layers_to_canvas(this.ctx, null, false);
		}
		//find color
		let c = this.ctx.getImageData(mouse!.x, mouse!.y, 1, 1).data;
		let hex = this.Helper.rgbToHex(c[0], c[1], c[2]);

		const newColorDefinition = { hex };
		if (c[3] > 0) {
			//set alpha
			// @ts-ignore
			newColorDefinition.a = c[3];
		}
		this.Base_gui.GUI_colors?.set_color(newColorDefinition);
	}

	copy_color_to_clipboard() {
		navigator.clipboard.writeText(config.COLOR);
	}

}

export default Pick_color_class;
