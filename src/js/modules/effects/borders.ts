import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";
import Effects_browser_class from "./browser";

class Effects_borders_class {
	Base_layers: Base_layers_class;
	POP: Dialog_class;
	Effects_browser: Effects_browser_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Effects_browser = new Effects_browser_class();
	}

	borders(filter_id: number) {
		if (config.layer.type == null) {
			alert("Layer is empty.");
			return;
		}

		let _this = this;
		let filter = this.Base_layers.find_filter_by_id(filter_id, "borders");

		let settings = {
			title: "Borders",
			params: [
				{ name: "color", title: "Color:", value: filter.color ??= config.COLOR, type: "color" },
				{ name: "size", title: "Size:", value: filter.size ??= 10 },
			],
			on_finish: function (params: any) {
				let target = Math.min(config.WIDTH, config.HEIGHT);
				_this.add_borders(params, filter_id);
			},
		};
		let rotate = config.layer.rotate;
		config.layer.rotate = 0;
		this.Base_layers.disable_filter(filter_id);
		this.POP.show(settings as any);
		config.layer.rotate = rotate;
		this.Base_layers.disable_filter(0);
	}

	demo(canvas_id: string, canvas_thumb: any) {
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//draw
		ctx.drawImage(canvas_thumb,
			5, 5,
			this.Effects_browser.preview_width - 10, this.Effects_browser.preview_height - 10);

		//add borders
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 10;
		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.stroke();
	}

	render_pre(ctx: CanvasRenderingContext2D, data: any) {

	}

	render_post(ctx: CanvasRenderingContext2D, data: { params: { size: number; color: any; }; }, layer: { x: number; y: number; width: string; height: string; rotate: number; }) {
		let size = Math.max(0, data.params.size);

		let x = layer.x;
		let y = layer.y;
		let width = parseInt(layer.width);
		let height = parseInt(layer.height);

		//legacy check
		if (x == null) x = 0;
		if (y == null) y = 0;
		if (!width) width = config.WIDTH;
		if (!height) height = config.HEIGHT;

		ctx.save();

		//set styles
		ctx.strokeStyle = data.params.color;
		ctx.lineWidth = size;

		//draw with rotation support
		ctx.translate(layer.x + width / 2, layer.y + height / 2);
		ctx.rotate(layer.rotate * Math.PI / 180);
		let x_new = -width / 2;
		let y_new = -height / 2;

		ctx.beginPath();
		ctx.rect(x_new - size * 0.5, y_new - size * 0.5, width + size, height + size);
		ctx.stroke();

		ctx.restore();
	}

	add_borders(params: undefined, filter_id: number) {
		//apply effect
		return app.State?.do_action(
			new app.Actions.Add_layer_filter_action(config.layer.id, "borders", params, filter_id)
		);
	}

}

export default Effects_borders_class;