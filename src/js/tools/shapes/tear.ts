import Base_tools_class from "../../core/base-tools.js";
import Base_layers_class from "../../core/base-layers.js";
import { Layer } from "../../../../types/types.js";

class Tear_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = "tear";
		this.layer = {} as Layer;
		this.best_ratio = 0.7;
		// TODO this.snap_line_info ={x: 0, y: 0};
	}

	load() {
		this.default_events();
	}

	mousedown(e: MouseEvent) {
		this.shape_mousedown(e);
	}

	mousemove(e: MouseEvent) {
		this.shape_mousemove(e);
	}

	mouseup(e: MouseEvent) {
		this.shape_mouseup(e);
	}

	render_overlay(ctx: CanvasRenderingContext2D){
		// TODO let ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
		ctx.fillStyle = "#aaa";
		ctx.strokeStyle = "#555";
		ctx.lineWidth = 2;

		let width_all = width + x * 2;
		width = height * this.best_ratio;
		x = (width_all - width) / 2;

		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		this.draw_shape(ctx, -width / 2, -height / 2, width, height, true, true);
		ctx.restore();
	}

	render(ctx: CanvasRenderingContext2D, layer: Layer) {
		let params = layer.params;
		ctx.save();

		//set styles
		ctx.strokeStyle = "transparent";
		ctx.fillStyle = "transparent";
		if(params.border)
			ctx.strokeStyle = params.border_color;
		if(params.fill)
			ctx.fillStyle = params.fill_color;
		ctx.lineWidth = params.border_size;

		//draw with rotation support
		ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
		ctx.rotate(layer.rotate * Math.PI / 180);
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, params.fill, params.border);

		ctx.restore();
	}

	draw_shape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: boolean , stroke: boolean | undefined) {
		let left = x;
		let top = y;

		//settings
		let curve_height = 29 / 100;
		let curve_start_x = 28 / 100;
		let curve_end_x = 1 - curve_start_x;
		let curve_cdx = 70;
		let curve_cdy = 58;

		ctx.beginPath();
		ctx.moveTo(left + width * 0.5, top);
		ctx.quadraticCurveTo(
			left + width * 0.5, top + height * 13 / 100,
			left + width * curve_end_x, top + height * curve_height
		);
		ctx.bezierCurveTo(
			left + width * (50 + curve_cdx) / 100, top + height * curve_cdy / 100,
			left + width * 100 / 100, top + height * 100 / 100,
			left + width * 0.5, top + height
		);
		ctx.bezierCurveTo(
			left + width * 0 / 100, top + height * 100 / 100,
			left + width * (50 - curve_cdx) / 100, top + height * curve_cdy / 100,
			left + width * curve_start_x, top + height * curve_height
		);
		ctx.quadraticCurveTo(
			left + width * 0.5, top + height * 13 / 100,
			left + width * 0.5, top
		);
		ctx.closePath();
		if (fill) {
			ctx.fill();
		}
		if (stroke) {
			ctx.stroke();
		}
	}

}

export default Tear_class;
