import app from "../../app";
import config from "../../config";
import Base_tools_class from "../../core/base-tools";
import Base_layers_class from "../../core/base-layers";
import { Layer, Params } from "../../../../types/types";

class Line_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;
	mouse_click: { x: number; y: number; };

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = "line";
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
		/* if (mouse.click_valid == false)
			return; */

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
			rotate: 0,
			is_vector: true,
			color: config.COLOR
		} as unknown as Layer;
		app.State?.do_action(
			new app.Actions.Bundle_action("new_line_layer", "New Line Layer", [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
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

		let width = mouse_x - (this.layer?.x ?? 0);
		let height = mouse_y - (this.layer?.y ?? 0);
		if (e.ctrlKey == true || e.metaKey) {
			//one direction only
			if (Math.abs(width) < Math.abs(height))
				width = 0;
			else
				height = 0;
		}

		//more data
		config.layer.width = width;
		config.layer.height = height;

		this.Base_layers.render();
	}

	mouseup(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		/* if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}
 */
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
		// TODO this.snap_line_info ={x: 0, y: 0};


		let width = mouse_x - (this.layer?.x ?? 0);
		let height = mouse_y - (this.layer?.y ?? 0);

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			app.State?.scrap_last_action();
			return;
		}

		if (e.ctrlKey == true || e.metaKey) {
			//one direction only
			if (Math.abs(width) < Math.abs(height))
				width = 0;
			else
				height = 0;
		}

		//more data
		app.State?.do_action(
			new app.Actions.Update_layer_action(config.layer.id, {
				width,
				height,
				status: undefined
			} as Layer),
			{ merge_with_history: "new_line_layer" }
		);
	}

	render_overlay(ctx: CanvasRenderingContext2D){
		// TODO let ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
		let coords = [
			[0, 0],
			[100, 100],
		];
		this.draw_shape(ctx, x, y, width, height, coords);
	}

	render(ctx: CanvasRenderingContext2D, layer: Layer) {
		if (layer.width == 0 && layer.height == 0)
			return;

		let params = layer.params;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.size;
		ctx.lineCap = "round";

		let width = layer.x + layer.width;
		let height = layer.y + layer.height;

		//draw line
		ctx.beginPath();
		ctx.moveTo(layer.x, layer.y);
		ctx.lineTo(width, height);
		ctx.stroke();
	}

}

export default Line_class;
