import app from "../../app.js";
import config from "../../config.js";
import Base_tools_class from "../../core/base-tools.js";
import Base_layers_class from "../../core/base-layers.js";
import { Layer, Params, Settings } from "../../../../types/types.js";

class Ellipse_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;
	layer: Layer | undefined;
	best_ratio: number;
	mouse_click: { x: number; y: number; };

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = "ellipse";
		this.layer = {} as Layer;
		this.best_ratio = 1;
		// TODO this.snap_line_info ={x: 0, y: 0};
		this.mouse_click ={x: 0, y: 0};
	}

	load() {
		this.default_events();
	}

	mousedown(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		

		let mouse_x = mouse.x;
		let mouse_y = mouse.y;

		//apply snap
		let snap_info = this.calc_snap_position(e, mouse_x, mouse_y);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}

		this.mouse_click.x = mouse_x;
		this.mouse_click.y = mouse_y;

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()) as Params,
			status: "draft",
			render_function: [this.name, "render"],
			x: mouse_x,
			y: mouse_y,
			color: "",
			is_vector: true,
		};
		if (params.circle == true) {
			//disable rotate
			if (this.layer)
				this.layer.rotate = 0;
		}
		app.State?.do_action(
			new app.Actions.Bundle_action("new_ellipse_layer", "New Ellipse Layer", [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();

		/* if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
			return;
		} */

		let mouse_x = Math.round(mouse.x);
		let mouse_y = Math.round(mouse.y);
		let click_x = Math.round(this.mouse_click.x);
		let click_y = Math.round(this.mouse_click.y);

		//apply snap
		let snap_info = this.calc_snap_position(e, mouse_x, mouse_y, config.layer.id);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}

		let x = Math.min(mouse_x, click_x);
		let y = Math.min(mouse_y, click_y);
		let width = Math.abs(mouse_x - click_x);
		let height = Math.abs(mouse_y - click_y);

		if (params.circle == true || e.ctrlKey == true || e.metaKey) {
			if (width < height) {
				width = height;
			}
			else {
				height = width;
			}
			if (mouse_x < click_x) {
				x = click_x - width;
			}
			if (mouse_y < click_y) {
				y = click_y - height;
			}
		}

		//more data
		config.layer.x = x;
		config.layer.y = y;
		config.layer.width = width;
		config.layer.height = height;

		this.Base_layers.render();
	}

	mouseup(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();

		/* if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		} */

		let mouse_x = Math.round(mouse.x);
		let mouse_y = Math.round(mouse.y);
		let click_x = Math.round(this.mouse_click.x);
		let click_y = Math.round(this.mouse_click.y);

		//apply snap
		let snap_info = this.calc_snap_position(e, mouse_x, mouse_y, config.layer.id);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}
		// this.snap_line_info ={x: 0, y: 0};

		let x = Math.min(mouse_x, click_x);
		let y = Math.min(mouse_y, click_y);
		let width = Math.abs(mouse_x - click_x);
		let height = Math.abs(mouse_y - click_y);

		if (params.circle == true || e.ctrlKey == true || e.metaKey) {
			if (width < height) {
				width = height;
			}
			else {
				height = width;
			}
			if (mouse_x < click_x) {
				x = click_x - width;
			}
			if (mouse_y < click_y) {
				y = click_y - height;
			}
		}

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			app.State?.scrap_last_action();
			return;
		}

		//more data
		app.State?.do_action(
			new app.Actions.Update_layer_action(config.layer.id, {
				x: x,
				y: y,
				width: width,
				height: height,
				status: undefined
			} as Layer),
			{ merge_with_history: "new_ellipse_layer" }
		);
	}

	render_overlay(ctx: CanvasRenderingContext2D){
		// TODO let ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
		

		ctx.fillStyle = "#aaa";
		ctx.strokeStyle = "#555";
		ctx.lineWidth = 3;

		this.ellipse(
			ctx,
			x,
			y,
			width,
			height,
			true,
			true
		);
	}

	render(ctx: CanvasRenderingContext2D, layer: { params: any; width: number; height: number; x: number; y: number; rotate: number; }) {
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

		let dist_x = layer.width;
		let dist_y = layer.height;

		ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
		ctx.rotate(layer.rotate * Math.PI / 180);
		this.ellipse(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, params.border, params.fill);

		ctx.restore();
	}

	ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: boolean, fill: boolean) {
		let kappa = .5522848,
			ox = (w / 2) * kappa, // control point offset horizontal
			oy = (h / 2) * kappa, // control point offset vertical
			xe = x + w, // x-end
			ye = y + h, // y-end
			xm = x + w / 2, // x-middle
			ym = y + h / 2; // y-middle

		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		if ( stroke == true)
			ctx.stroke();
		if (fill == true)
			ctx.fill();
	}

}

export default Ellipse_class;
