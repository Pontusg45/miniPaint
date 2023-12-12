import Base_tools_class from "../../core/base-tools";
import Base_layers_class from "../../core/base-layers";
import { Layer } from "../../../../types/types";

class Callout_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = "callout";
		this.layer = {} as Layer;
		this.best_ratio = 1.3;
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
		this.draw_shape(ctx, -width / 2, -height / 2, width, height);
		ctx.restore();
	}

	render(ctx: CanvasRenderingContext2D, layer: { params: any; x: number; width: number; y: number; height: number; rotate: number; }) {
		let params = layer.params;
		let fill = params.fill;

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
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height);

		ctx.restore();
	}

	draw_shape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, coords?: boolean | number[][] | undefined) {
		ctx.lineJoin = "round";

		ctx.beginPath();

		ctx.moveTo(x, y);
		ctx.lineTo(x + width, y);
		ctx.lineTo(x + width, y + height * 0.6);

		ctx.lineTo(x + width / 2 + width / 10, y + height * 0.6);
		ctx.lineTo(x + width / 8, y + height);
		ctx.lineTo(x + width / 2 - width / 10, y + height * 0.6);

		ctx.lineTo(x, y + height * 0.6);
		ctx.lineTo(x, y);

		ctx.closePath();

		ctx.fill();
		ctx.stroke();
	}

}

export default Callout_class;
