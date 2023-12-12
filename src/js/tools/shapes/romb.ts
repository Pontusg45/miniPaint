import app from "../../app";
import config from "../../config";
import Base_tools_class from "../../core/base-tools";
import Base_layers_class from "../../core/base-layers";
import { Layer } from "../../../../types/types";

class Romb_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;
	coords_demo: number[][];
	coords: number[][];

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = "romb";
		this.layer = {} as Layer;
		this.best_ratio = 0.8;
		// TODO this.snap_line_info ={x: 0, y: 0};
		this.coords_demo = [
			[50, 0],
			[80, 50],
			[50, 100],
			[20, 50],
			[50, 0],
		];
		this.coords = [
			[50, 0],
			[100, 50],
			[50, 100],
			[0, 50],
			[50, 0],
		];
	}

	load() {
		this.default_events();
	}

	mousedown(e: MouseEvent) {
		this.shape_mousedown(e);
	}

	mousemove(e: MouseEvent ) {
		this.shape_mousemove(e);
	}

	mouseup(e: MouseEvent ) {
		this.shape_mouseup(e);
	}

	render_overlay(ctx: CanvasRenderingContext2D){
		// TODO let ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
		this.draw_shape(ctx, x, y, width, height, this.coords_demo);
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
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, this.coords, false);

		ctx.restore();
	}

}

export default Romb_class;
