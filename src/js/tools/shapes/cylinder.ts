import Base_tools_class from "../../core/base-tools.js";
import Base_layers_class from "../../core/base-layers.js";

class Cylinder_class extends Base_tools_class {
  // private ctx: CanvasRenderingContext2D;
  // private layer: {};
	best_ratio: number;

	constructor() {
		super();
		this.Base_layers = new Base_layers_class();
		// this.ctx = ctx;
		this.name = "cylinder";
		// this.layer = {};
		this.best_ratio = 0.7;
		// TODO
		/* this.snap_line_info ={
			x: 0,
			y: 0}; */
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

	render_overlay(){
    //const ctx = this.Base_layers.ctx;
		if(this.Base_layers.ctx)
			this.render_overlay_parent(this.Base_layers.ctx);
	}

	demo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
		ctx.fillStyle = "#aaa";
		ctx.strokeStyle = "#555";
		ctx.lineWidth = 2;

    const width_all = width + x * 2;
    width = height * this.best_ratio;
		x = (width_all - width) / 2;

		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		this.draw_shape(ctx, -width / 2, -height / 2, width, height);
		ctx.restore();
	}

	render(ctx: CanvasRenderingContext2D, layer: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotate: number;
    params: { fill: boolean; fill_color: string; border: true; border_color: string; border_size: number; };
  }) {
    const params = layer.params;
    // const fill = params.fill;

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

	draw_shape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
		ctx.lineJoin = "round";

		ctx.beginPath();

		ctx.scale(1, 1.20);
		ctx.translate(-width / 2, -height / 2);

    const dh = height / 3;

    ctx.moveTo(0, dh);
		ctx.bezierCurveTo(0,dh+dh, width,dh+dh, width,dh);
		ctx.bezierCurveTo(width,dh-dh, 0,dh-dh, 0,dh);
		ctx.lineTo(0, height-dh);
		ctx.bezierCurveTo(0,height-dh+dh, width,height-dh+dh, width,height-dh);
		ctx.lineTo(width, dh);

		ctx.fill();
		ctx.stroke();
	}

}

export default Cylinder_class;
