import app from "../../app.js";
import config from "../../config.js";
import Base_tools_class from "../../core/base-tools.js";
import Base_layers_class from "../../core/base-layers.js";
import Helper_class from "../../libs/helpers.js";
import { Layer } from "../../../../types/types.js";

class Polygon_class extends Base_tools_class {
	ctx: CanvasRenderingContext2D;
	layer: undefined | Layer;
	best_ratio: number;
	params_hash: string;
	selected_obj_positions: {};
	mouse_lock: null;
	selected_object_drag_type: string;
	old_data: null;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = "polygon";
		this.layer = {} as Layer;
		this.best_ratio = 1;
		// TODO this.snap_line_info ={x: 0, y: 0};
		this.params_hash = "";
		this.selected_obj_positions = {};
		this.mouse_lock = null;
		this.selected_object_drag_type = "";
		this.old_data = null;

		this.events();
	}

	load() {
		let _this = this;
		this.default_events();
		document.addEventListener("keydown", function (event) {
			let code = event.code;
			if (config.TOOL.name == _this.name && code == "Escape") {
				//escape
				config.layer.status = undefined;
			}
		});
	}

	/**
	 * events for handling helping lines only
	 */
	events() {
		document.addEventListener("mousedown", (e) => {
			this.selected_object_actions(e);
		});
		document.addEventListener("mousemove", (e) => {
			this.selected_object_actions(e);
		});
		document.addEventListener("mouseup", (e) => {
			this.selected_object_actions(e);
		});

		// touch
		/* document.addEventListener("touchstart", (event) => {
			this.selected_object_actions(event);
		});
		document.addEventListener("touchmove", (event) => {
			this.selected_object_actions(event);
		}, {passive: false});
		document.addEventListener("touchend", (event) => {
			this.selected_object_actions(event);
		}); */
	}

	mousedown(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		/* if (mouse.click_valid == false) {
			return;
		} */

		let params_hash = this.get_params_hash();

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

		if (config.layer.type != this.name || params_hash != this.params_hash || (config.layer.data != null && config.layer.status != "draft")) {
			//register new object - current layer is not ours or params changed
			this.layer = {
				type: this.name,
				data: [
					{x: mouse_x, y: mouse_y}
				],
				params: this.clone(this.getParams()),
				render_function: [this.name, "render"],
				x: 0,
				y: 0,
				width: null,
				height: null,
				hide_selection_if_active: true,
				rotate: null,
				is_vector: true,
				color: null,
				status: "draft",
			};
			app.State?.do_action(
				new app.Actions.Bundle_action("new_polygon_layer", "New Polygon Layer", [
					new app.Actions.Insert_layer_action(this.layer)
				])
			);
			this.params_hash = params_hash;
		}
		else {
			//add more data
			config.layer.data?.push(
				{x: mouse_x, y: mouse_y}
			);
		}

		this.Base_layers.render();
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let mouse_x = Math.round(mouse.x);
		let mouse_y = Math.round(mouse.y);

		/* if (mouse.click_valid == false) {
			return;
		}
		if (mouse.is_drag == false) {
			return;
		} */

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

		//add more data
		config.layer.data[config.layer.data.length - 1] = {x: mouse_x, y: mouse_y};

		this.Base_layers.render();
	}

	mouseup(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		/* if (mouse.click_valid == false) {
			return;
		}
 */
		let mouse_x = Math.round(mouse.x);
		let mouse_y = Math.round(mouse.y);

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
		this.snap_line_info ={x: 0, y: 0};

		//add more data
		config.layer.data[config.layer.data.length - 1] = {x: mouse_x, y: mouse_y};

		this.Base_layers.render();
	}

	render_overlay(ctx: CanvasRenderingContext2D){
		// TODO let ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);

		if(config.TOOL.name != "select"){
			return;
		}

		//also draw control lines
		if(config.layer.type == this.name){
			let data = config.layer.data;
			this.selected_obj_positions = {};

			//draw corners
			for(let i in data) {
				let point = data[i];

				this.selected_obj_positions[i] = this.Helper.draw_control_point(
					this.ctx,
					config.layer.x + point.x,
					config.layer.y + point.y
				);
			}
		}
	}

	select(ctx: CanvasRenderingContext2D) {
		this.render_overlay(ctx);
	}

	demo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
		ctx.fillStyle = "#aaa";
		ctx.strokeStyle = "#555";
		ctx.lineWidth = 2;

		let width_all = width + x * 2;
		width = height * this.best_ratio;
		x = (width_all - width) / 2;

		let data = [
			{x: 0, y: 0},
			{x: width, y: 0},
			{x: width * 1.1, y: height * 2 / 3},
			{x: width / 2, y: height / 3},
			{x: -1 * width * 0.2, y: height},
		];

		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		this.draw_polygon(ctx, -width / 2, -height / 2, width, height, data);
		ctx.restore();
	}

	render(ctx: CanvasRenderingContext2D, layer: { params: any; x: number; width: number; y: number; height: number; rotate: number; data: any; }) {
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
		this.draw_polygon(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, layer.data);

		ctx.restore();
	}

	draw_polygon(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, data: {
		x: number;
		y: number;
	}[]) {
		if(data.length == 0){
			return;
		}

		//draw
		ctx.beginPath();
		for(let i = 0; i < data.length; i++) {
			if(i == 0){
				ctx.moveTo(x + data[i].x, y + data[i].y);
			}
			else{
				ctx.lineTo(x + data[i].x, y + data[i].y);
			}
		}
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	selected_object_actions(e: MouseEvent) {
		if(config.TOOL.name != "select" || config.layer.type != this.name){
			return;
		}

		let ctx = this.Base_layers.ctx;
		let mouse = this.get_mouse_info(e);
		const mainWrapper = document.getElementById("main_wrapper");

		//simplify checks
		let event_type = e.type;
		if(event_type == "touchstart") event_type = "mousedown";
		if(event_type == "touchmove") event_type = "mousemove";
		if(event_type == "touchend") event_type = "mouseup";

		if (event_type == "mouseup" && mainWrapper) {
			//reset
			config.mouse_lock = null;
			if (mainWrapper.style.cursor != "default") {
				mainWrapper.style.cursor = "default";
			}
		}

		/* if (event_type == "mousedown" && config.mouse.valid == false) {
			return;
		} */

		if (event_type == "mousemove" && this.mouse_lock == "move_point" && mouse.is_drag && mainWrapper) {
			mainWrapper.style.cursor = "move";

			if (e.buttons == 1 || typeof e.buttons == "undefined") {
				let type = this.selected_object_drag_type;
				let bezier = config.layer.data;

				// Do transformations
				let dx = Math.round(mouse.x - mouse.click_x) - config.layer.x;
				let dy = Math.round(mouse.y - mouse.click_y) - config.layer.y;

				// Set values
				// @ts-ignore
				config.layer.data[type] = {
					x: mouse.click_x + dx,
					y: mouse.click_y + dy
				};

				config.need_render = true;
			}
			return;
		}
		if (event_type == "mouseup" && this.mouse_lock == "move_point") {
			this.mouse_lock = null;
			let bezier = config.layer.data;

			//reset sate
			config.layer.data = this.old_data;

			//save state
			app.State?.do_action(
				new app.Actions.Bundle_action("change_layer_details", "Change Layer Details", [
					new app.Actions.Update_layer_action(config.layer.id, {
						data: bezier,
					} as Layer)
				])
			);

			config.need_render = true;
		}

		if (!mouse.is_drag && ["mousedown", "mouseup"].includes(event_type)) {
			return;
		}

		if (!this.mouse_lock) {
			for (let current_drag_type in this.selected_obj_positions) {
				const position = this.selected_obj_positions[current_drag_type];
				if (position && this.ctx.isPointInPath(position, mouse.x, mouse.y)) {
					// match
					if (event_type == "mousedown") {
						if (e.buttons == 1 || typeof e.buttons == "undefined") {
							this.mouse_lock = "move_point";
							this.selected_object_drag_type = current_drag_type;
						}
						config.mouse_lock = true;
						this.old_data = JSON.parse(JSON.stringify(config.layer.data));
					}
					if (event_type == "mousemove" && mainWrapper) {
						mainWrapper.style.cursor = "move";
					}
				}
			}
		}
	}

}

export default Polygon_class;
