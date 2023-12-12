// @ts-nocheck
import app from "../app";
import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";
import Base_selection_class from "../core/base-selection";
import Helper_class from "../libs/helpers";
import Dialog_class from "../libs/popup";

class Select_tool_class extends Base_tools_class {
	POP: Dialog_class;
	ctx: CanvasRenderingContext2D;
	saved: boolean;
	mousedown_dimensions: { x: number; y: number; width: number; height: number; };
	keyboard_move_start_position: null;
	moving: boolean;
	resizing: boolean;
	rotate_initial: number | null;
	Base_selection: Base_selection_class;

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = "select";
		this.saved = false;
		this.mousedown_dimensions = { x: 0, y: 0, width: 0, height: 0 };
		this.keyboard_move_start_position = null;
		this.moving = false;
		this.resizing = false;
		this.snap_line_info ={x: 0, y: 0};
		this.rotate_initial = null;

		let sel_config = {
			enable_background: false,
			enable_borders: true,
			enable_controls: true,
			keep_ratio: true,
			enable_rotation: true,
			enable_move: true,
			data_function: function () {
				return config.layer;
			},
		};
		this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);
	}

	load() {
		let _this = this;

		//mouse events
		document.addEventListener("mousedown", function (e) {
			_this.dragStart(e);
		});
		document.addEventListener("mousemove", function (e) {
			_this.dragMove(e);
		});
		document.addEventListener("mouseup", function (e) {
			_this.dragEnd(e);
		});

		// collect touch events
		document.addEventListener("touchstart", function (e) {
			_this.dragStart(e);
		});
		document.addEventListener("touchmove", function (e) {
			_this.dragMove(e);
		});
		document.addEventListener("touchend", function (e) {
			_this.dragEnd(e);
		});

		//keyboard actions
		document.addEventListener("keydown", (event) => {
			if (config.TOOL.name != this.name)
				return;
			if (this.POP.get_active_instances() > 0) {
				return;
			}
			if (event.target && this.Helper.is_input(event.target))
				return;
			let k = event.key;

			if (k == "ArrowUp") {
				this.move(0, -1, event);
			}
			else if (k == "ArrowDown") {
				this.move(0, 1, event);
			}
			else if (k == "ArrowRight") {
				this.move(1, 0, event);
			}
			else if (k == "ArrowLeft") {
				this.move(-1, 0, event);
			}
			if (k == "Delete") {
				if (config.TOOL.name == this.name) {
					app.State?.do_action(
						new app.Actions.Delete_layer_action(config.layer.id)
					);
				}
			}
		});
		document.addEventListener("keyup", (event) => {
			if (config.TOOL.name != this.name)
				return;
			if (this.POP.active == true)
				return;
			if (event.target && this.Helper.is_input(event.target))
				return;
			let k = event.key;
			if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
				if (this.keyboard_move_start_position) {
					let x = config.layer.x;
					let y = config.layer.y;
					config.layer.x = this.keyboard_move_start_position.x;
					config.layer.y = this.keyboard_move_start_position.y;
					app.State?.do_action(
						new app.Actions.Update_layer_action(config.layer.id, { x, y })
					);
					this.keyboard_move_start_position = null;
				}
			}
		});
	}

	dragStart(event: MouseEvent) {
		let mouse = this.get_mouse_info(event);

		this.mousedown(event);
	}

	dragMove(event: MouseEvent) {

		this.mousemove(event);
	}

	dragEnd(event: MouseEvent) {
		let mouse = this.get_mouse_info(event);
		if (config.TOOL.name != this.name)
			return;

		this.mouseup(event);
		this.Base_layers.render();
	}

	async mousedown(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		this.rotate_initial = config.layer.rotate;

		if (this.Base_selection.mouse_lock != null) {
			this.resizing = true;
			this.Base_selection.find_settings().keep_ratio = config.layer.type === "image";
			if (config.layer.type === "text" && config.layer.params && config.layer.params.boundary === "dynamic") {
				config.layer.params.boundary = "box";
			}
		}
		else {
			this.moving = true;
			await this.auto_select_object(e);
			this.Base_selection.find_settings().keep_ratio = config.layer.type === "image";
			this.saved = false;
		}

		this.mousedown_dimensions = {
			x: Math.round(config.layer.x),
			y: Math.round(config.layer.y),
			width: Math.round(config.layer.width),
			height: Math.round(config.layer.height)
		};
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false || mouse.click_valid == false || config.mouse_lock === true) {
			return;
		}
		if (this.resizing) {

			//also handle rotation
			let rotate = this.Base_selection.current_angle;
			if(config.layer.rotate != rotate && rotate !== null){
				config.layer.rotate = rotate;
			}

			return;
		}
		else if (this.moving) {
			//move object
			config.layer.x = Math.round(mouse.x - mouse.click_x + this.mousedown_dimensions.x);
			config.layer.y = Math.round(mouse.y - mouse.click_y + this.mousedown_dimensions.y);

			//apply snap
			let snap_info = this.calc_snap(e, config.layer.x, config.layer.y);
			if(snap_info != null){
				if(snap_info.x != null) {
					config.layer.x = snap_info.x;
				}
				if(snap_info.y != null) {
					config.layer.y = snap_info.y;
				}
			}

			config.need_render = true;
		}
	}

	mouseup(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false || config.mouse_lock === true) {
			return;
		}
		if (this.resizing) {
			let x = config.layer.x;
			let y = config.layer.y;
			let width = config.layer.width;
			let height = config.layer.height;

			//reset values
			config.layer.x = this.mousedown_dimensions.x;
			config.layer.y = this.mousedown_dimensions.y;
			config.layer.width = this.mousedown_dimensions.width;
			config.layer.height = this.mousedown_dimensions.height;
			if (
				this.mousedown_dimensions.x !== x || this.mousedown_dimensions.y !== y ||
				this.mousedown_dimensions.width !== width || this.mousedown_dimensions.height !== height
			) {
				app.State?.do_action(
					new app.Actions.Bundle_action("resize_layer", "Resize Layer", [
						new app.Actions.Update_layer_action(config.layer.id, {
							x, y, width, height
						})
					])
				);
			}

			//also handle rotation
			let rotate = this.Base_selection.current_angle;
			if(this.rotate_initial != rotate && rotate !== null){
				//save state
				config.layer.rotate = this.rotate_initial;
				app.State?.do_action(
					new app.Actions.Bundle_action("resize_layer", "Resize Layer", [
						new app.Actions.Update_layer_action(config.layer.id, {
							rotate
						})
					])
				);
			}
		}
		else if (this.moving) {
			let new_x = Math.round(mouse.x - mouse.click_x + this.mousedown_dimensions.x);
			let new_y = Math.round(mouse.y - mouse.click_y + this.mousedown_dimensions.y);
			config.layer.x = this.mousedown_dimensions.x;
			config.layer.y = this.mousedown_dimensions.y;

			if(mouse.x - mouse.click_x || mouse.y - mouse.click_y) {
				let snap_info = this.calc_snap(e, new_x, new_y);
				if (snap_info != null) {
					if (snap_info.x != null) {
						new_x = snap_info.x;
					}
					if (snap_info.y != null) {
						new_y = snap_info.y;
					}
				}
			}

			if (this.mousedown_dimensions.x !== new_x || this.mousedown_dimensions.y !== new_y) {
				app.State?.do_action(
					new app.Actions.Bundle_action("move_layer", "Move Layer", [
						new app.Actions.Update_layer_action(config.layer.id, {
							x: new_x,
							y: new_y
						})
					])
				);
			}
		}
		this.moving = false;
		this.resizing = false;
	}

	render_overlay(ctx: CanvasRenderingContext2D){
		let ctx = this.Base_layers.ctx;
		let mouse = this.get_mouse_info(event);

		//maybe related tool have additional overlay render handlers?
		if(config.layer.render_function != null) {
			let render_class = config.layer.render_function[0];
			let render_function = "select";
			if (
				typeof this.Base_gui.GUI_tools.tools_modules[render_class].object[
					render_function
					] != "undefined"
			) {
				this.Base_gui.GUI_tools.tools_modules[render_class].object[
					render_function
					](this.ctx);
			}
		}

		if (mouse.is_drag == false)
			return;

		this.render_overlay_parent(ctx);
	}

	/**
	 * calculates current object snap coordinates and returns it. One of coordinates can be null.
	 *
	 * @param event
	 * @param pos_x
	 * @param pos_y
	 * @returns object|null
	 */
	calc_snap(event: { shiftKey: boolean; }, pos_x: number, pos_y: number) {
		let snap_position = { x: null, y: null };
		let params = this.getParams();

		if(config.SNAP === false || event.shiftKey == true){
			this.snap_line_info ={x: 0, y: 0};
			return null;
		}

		//settings
		let sensitivity = 0.01;
		let max_distance = (config.WIDTH + config.HEIGHT) / 2 * sensitivity / config.ZOOM;

		//collect snap positions
		let snap_positions = this.get_snap_positions(config.layer.id);

		//find closest snap positions
		let min_group = {
			x: {
				start: null,
				center: null,
				end: null,
			},
			y: {
				start: null,
				center: null,
				end: null,
			},
		};
		let min_group_distance = {
			x: {
				start: null,
				center: null,
				end: null,
			},
			y: {
				start: null,
				center: null,
				end: null,
			},
		};
		//x
		for(let i in snap_positions.x){
			let distance = Math.abs(pos_x - snap_positions.x[i]);
			if(distance < max_distance && (distance < min_group_distance.x.start || min_group_distance.x.start === null)){
				min_group_distance.x.start = distance;
				min_group.x.start = snap_positions.x[i];
			}

			let distance = Math.abs(pos_x + config.layer.width/2 - snap_positions.x[i]);
			if(distance < max_distance && (distance < min_group_distance.x.center || min_group_distance.x.center === null)){
				min_group_distance.x.center = distance;
				min_group.x.center = snap_positions.x[i];
			}

			let distance = Math.abs(pos_x + config.layer.width - snap_positions.x[i]);
			if(distance < max_distance && (distance < min_group_distance.x.end || min_group_distance.x.end === null)){
				min_group_distance.x.end = distance;
				min_group.x.end = snap_positions.x[i];
			}
		}
		//y
		for(let i in snap_positions.y){
			let distance = Math.abs(pos_y - snap_positions.y[i]);
			if(distance < max_distance && (distance < min_group_distance.y.start || min_group_distance.y.start === null)){
				min_group_distance.y.start = distance;
				min_group.y.start = snap_positions.y[i];
			}

			let distance = Math.abs(pos_y + config.layer.height/2 - snap_positions.y[i]);
			if(distance < max_distance && (distance < min_group_distance.y.center || min_group_distance.y.center === null)){
				min_group_distance.y.center = distance;
				min_group.y.center = snap_positions.y[i];
			}

			let distance = Math.abs(pos_y + config.layer.height - snap_positions.y[i]);
			if(distance < max_distance && (distance < min_group_distance.y.end || min_group_distance.y.end === null)){
				min_group_distance.y.end = distance;
				min_group.y.end = snap_positions.y[i];
			}
		}

		//find best begin, center, end
		let min_distance = {
			x: null,
			y: null,
		};
		//x
		if(min_group_distance.x.start != null)
			min_distance.x = min_group_distance.x.start;
		if(min_group_distance.x.center != null && (min_group_distance.x.center < min_distance.x || min_distance.x === null))
			min_distance.x = min_group_distance.x.center;
		if(min_group_distance.x.end != null && (min_group_distance.x.end < min_distance.x || min_distance.x === null))
			min_distance.x = min_group_distance.x.end;
		//y
		if(min_group_distance.y.start != null)
			min_distance.y = min_group_distance.y.start;
		if(min_group_distance.y.center != null && (min_group_distance.y.center < min_distance.y || min_distance.y === null))
			min_distance.y = min_group_distance.y.center;
		if(min_group_distance.y.end != null && (min_group_distance.y.end < min_distance.y || min_distance.y === null))
			min_distance.y = min_group_distance.y.end;

		//apply snap
		let success = false;
		//x
		if(min_group.x.center != null && min_group_distance.x.center == min_distance.x) {
			snap_position.x = Math.round(min_group.x.center - config.layer.width / 2);
			success = true;
			this.snap_line_info.x = {
				start_x: min_group.x.center,
				start_y: 0,
				end_x: min_group.x.center,
				end_y: config.HEIGHT
			};
		}
		else if(min_group.x.start != null && min_group_distance.x.start == min_distance.x) {
			snap_position.x = Math.round(min_group.x.start);
			success = true;
			this.snap_line_info.x = {
				start_x: min_group.x.start,
				start_y: 0,
				end_x: min_group.x.start,
				end_y: config.HEIGHT,
			};
		}
		else if(min_group.x.end != null && min_group_distance.x.end == min_distance.x) {
			snap_position.x = Math.round(min_group.x.end - config.layer.width);
			success = true;
			this.snap_line_info.x = {
				start_x: min_group.x.end,
				start_y: 0,
				end_x: min_group.x.end,
				end_y: config.HEIGHT
			};
		}
		else{
			this.snap_line_info.x = null;
		}
		//y
		if(min_group.y.center != null && min_group_distance.y.center == min_distance.y) {
			snap_position.y = Math.round(min_group.y.center - config.layer.height / 2);
			success = true;
			this.snap_line_info.y = {
				start_x: 0,
				start_y: min_group.y.center,
				end_x: config.WIDTH,
				end_y: min_group.y.center,
			};
		}
		else if(min_group.y.start != null && min_group_distance.y.start == min_distance.y) {
			snap_position.y = Math.round(min_group.y.start);
			success = true;
			this.snap_line_info.y = {
				start_x: 0,
				start_y: min_group.y.start,
				end_x: config.WIDTH,
				end_y: min_group.y.start,
			};
		}
		else if(min_group.y.end != null && min_group_distance.y.end == min_distance.y) {
			snap_position.y = Math.round(min_group.y.end - config.layer.height);
			success = true;
			this.snap_line_info.y = {
				start_x: 0,
				start_y: min_group.y.end,
				end_x: config.WIDTH,
				end_y: min_group.y.end,
			};
		}
		else{
			this.snap_line_info.y = null;
		}

		if(success) {
			return snap_position;
		}

		return null;
	}

	move(direction_x: number, direction_y: number, event: KeyboardEvent) {
		if (!this.keyboard_move_start_position) {
			this.keyboard_move_start_position = {
				x: config.layer.x,
				y: config.layer.y
			};
		}
		let power = 10;
		if (event.ctrlKey == true || event.metaKey)
			power = 50;
		if (event.shiftKey == true)
			power = 1;

		config.layer.x += direction_x * power;
		config.layer.y += direction_y * power;
		config.need_render = true;
	}

	async auto_select_object(e: any) {
		let params = this.getParams();
		if (params.auto_select == false)
			return;

		let layers_sorted = this.Base_layers.get_sorted_layers();

		//render main canvas
		for (let i = 0; i < layers_sorted.length; i++) {
			let value = layers_sorted[i];
			let canvas = this.Base_layers.convert_layer_to_canvas(value.id, null, false);

			if (this.check_hit_region(e, canvas.getContext("2d"), value) == true) {
				await app.State?.do_action(
					new app.Actions.Select_layer_action(value.id)
				);
				break;
			}
		}
	}

	check_hit_region(e: MouseEvent, ctx: CanvasRenderingContext2D, layer: Base_layers_class) {
		let mouse = this.get_mouse_info(e);

		if(layer.type == "image" && Math.abs(layer.width * layer.height / 1000000) > 5){
			//too big to check using getImageData - use simple way
			if (mouse.x > layer.x && mouse.x < layer.x + layer.width &&
				mouse.y > layer.y && mouse.y < layer.y + layer.height) {
				//hit
				return true;
			}

			return false;
		}

		let data = ctx.getImageData(mouse.x, mouse.y, 1, 1).data;
		let blank = [0, 0, 0, 0];
		if (config.TRANSPARENCY == false) {
			blank = [0, 0, 0, 0];
		}

		if (data[0] != blank[0] || data[1] != blank[1] || data[2] != blank[2]
			|| data[3] != blank[3]) {
			//hit
			return true;
		}

		return false;
	}

}

export default Select_tool_class;
