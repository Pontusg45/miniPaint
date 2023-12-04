/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from "../config.js";
import Base_layers_class from "./base-layers.js";
import Base_gui_class from "./base-gui.js";
import app from "../app.js";
import Helper_class from "../libs/helpers.js";
import BaseLayers from "./base-layers.js";
import { Layer, Params } from "../../../types/types.js";

/**
 * Base tools class, can be used for extending on tools like brush, provides various helping methods.
 */
class Base_tools_class {

	Base_layers: BaseLayers;
	Base_gui: Base_gui_class;
	Helper: Helper_class;
	is_drag: boolean;
	mouse_last_click_pos: number[];
	mouse_click_pos: number[];
	mouse_move_last: number[];
	mouse_valid: boolean;
	mouse_click_valid: boolean;
	speed_average: number;
	save_mouse: boolean;
	is_touch: boolean;

	name: string = "";

	snap_line_info = {x: {
		start_x: 0,
		start_y: 0,
		end_x: 0,
		end_y: 0,
	}, y: {
		start_x: 0,
		start_y: 0,
		end_x: 0,
		end_y: 0,
	}};

	//shape
	shape_mouse_click: {x: number; y: number};
	layer: Layer | undefined;
	best_ratio: number = 1;

	constructor(save_mouse = false) {
		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Helper = new Helper_class();
		this.is_drag = false;
		this.mouse_last_click_pos = [0, 0];
		this.mouse_click_pos = [0, 0];
		this.mouse_move_last = [0, 0];
		this.mouse_valid = false;
		this.mouse_click_valid = false;
		this.speed_average = 0;
		this.save_mouse = save_mouse;
		this.is_touch = false;
		this.shape_mouse_click = {x: 0, y: 0};

		this.prepare();

		if (this.save_mouse) {
			this.events();
		}
	}

	dragStart(event: MouseEvent) {
    // const _this = this;

    let mouse = this.get_mouse_info(event);
    if (mouse === null) {
      alert("Mouse not set yet");
      return;
    }
		this.mouse_click_pos[0] = mouse.x;
    this.mouse_click_pos[1] = mouse.y;

		//update
    this.set_mouse_info(event);

    this.is_drag = true;
    this.speed_average = 0;

    mouse = this.get_mouse_info(event);
    if (mouse === null) {
      alert("Mouse not set yet");
      return;
    }
    this.mouse_last_click_pos[0] = mouse.x;
    this.mouse_last_click_pos[1] = mouse.y;
	}

	dragMove(event: MouseEvent) {
		this.set_mouse_info(event);

		const newAverage = this.calc_average_mouse_speed(event);
		if (newAverage !== null) {
			this.speed_average = newAverage;
		}
	}

	dragEnd(event:MouseEvent) {
		this.is_drag = false;
		this.set_mouse_info(event);
	}

	events() {

		//collect mouse info
		document.addEventListener("mousedown", (event:MouseEvent) => {
			if(this.is_touch)
				return;

			this.dragStart(event);
		});
		document.addEventListener("mousemove", (event:MouseEvent) => {
			if(this.is_touch)
				return;

			this.dragMove(event);
		});
		document.addEventListener("mouseup", (event:MouseEvent) => {
			if(this.is_touch)
				return;

			this.dragEnd(event);
		});

		/* // collect touch info
		document.addEventListener("touchstart", (event: TouchEvent) => {
			this.is_touch = true;
			this.dragStart(event);
		});
		document.addEventListener("touchmove", (event: TouchEvent) => {
			this.dragMove(event);
			if (event.target.id === "canvas_minipaint" && !$(".scroll").has($(event.target)).length)
				event.preventDefault();
		}, {passive: false});
		document.addEventListener("touchend", function (TouchEvent) {
			_this.dragEnd(event);
		}); */
		
		//on resize
		window.addEventListener("resize", () => {
			this.prepare();
		});
	}

	/**
	 * do preparation
	 */
	prepare() {
		// TODO
		// this.is_drag = config.mouse?.is_drag ;
	}

	set_mouse_info(event: MouseEvent) {
		if (this.save_mouse !== true) {
			//not main
			return false;
		}

		const eventType = event.type;

		const target = event.target as HTMLElement;

		if (target.id !== "canvas_minipaint" && target.id != "main_wrapper") {
			//outside canvas
			this.mouse_valid = false;
		}
		else {
			this.mouse_valid = true;
		}

		if (eventType === "mousedown" || eventType === "touchstart") {
			if ((target.id != "canvas_minipaint" && target.id != "main_wrapper") || (event.which != 1 && eventType !== "touchstart")) {
				this.mouse_click_valid = false;
			}
			else {
				this.mouse_click_valid = true;
			}
			this.mouse_valid = true;
		}

		/* if (event.changedTouches) {
			//using touch events
			event = event.changedTouches[0];
		} */

		const mouse_coords = this.get_mouse_coordinates_from_event(event);
		const mouse_x = mouse_coords.x;
		const mouse_y = mouse_coords.y;

		const start_pos = this.Base_layers.get_world_coords(0, 0);
		const x_rel = mouse_x - start_pos.x;
		const y_rel = mouse_y - start_pos.y;

		//save
		config.mouse = {
			...event,
			x_rel,
			y_rel,
			x: mouse_x,
			y: mouse_y,
			last_click_x: this.mouse_last_click_pos[0], //last click
			last_click_y: this.mouse_last_click_pos[1], //last click
			click_x: this.mouse_click_pos[0],
			click_y: this.mouse_click_pos[1],
			last_x: this.mouse_move_last[0],
			last_y: this.mouse_move_last[1],
			valid: this.mouse_valid,
			click_valid: this.mouse_click_valid,
			is_drag: this.is_drag,
			speed_average: this.speed_average,
		};

		if (eventType === "mousemove" || eventType === "touchmove") {
			//save last pos
			this.mouse_move_last[0] = mouse_x;
			this.mouse_move_last[1] = mouse_y;
		}
	}

	get_mouse_coordinates_from_event(event: MouseEvent){
		let mouse_x = event.pageX - this.Base_gui.canvas_offset.x;
		let mouse_y = event.pageY - this.Base_gui.canvas_offset.y;

		//adapt coords to ZOOM
		const global_pos = this.Base_layers.get_world_coords(mouse_x, mouse_y);
		mouse_x = global_pos.x;
		mouse_y = global_pos.y;

		return {
			x: mouse_x,
			y: mouse_y,
		};
	}

	get_mouse_info(event: MouseEvent) {
		if(typeof event != "undefined"){
			//mouse not set yet - set it now...
			this.set_mouse_info(event);
		}
		return config.mouse;
	}

	calc_average_mouse_speed(event: MouseEvent) {
		if (this.is_drag)
			return null;

		//calc average speed
		const avg_speed_max = 30;
		const avg_speed_changing_power = 2;
		const mouse = this.get_mouse_info(event);

		if (!mouse) {
			return null;
		}
		
		const dx = Math.abs(mouse.x - mouse.last_x);
		const dy = Math.abs(mouse.y - mouse.last_y);
		const delta = Math.sqrt(dx * dx + dy * dy);
		let mouse_average_speed = this.speed_average;
		if (delta > avg_speed_max / 2) {
			mouse_average_speed += avg_speed_changing_power;
		}
		else {
			mouse_average_speed -= avg_speed_changing_power;
		}
		mouse_average_speed = Math.max(0, mouse_average_speed); //min
		mouse_average_speed = Math.min(avg_speed_max, mouse_average_speed); //max

		return mouse_average_speed;
	}

	get_params_hash() {
		const data = [
			this.getParams(),
			config.COLOR,
			config.ALPHA,
		];
		return JSON.stringify(data);
	}

	clone(object: object) {
		return JSON.parse(JSON.stringify(object)) as object;
	}

	/**
	 * customized mouse cursor
	 *
	 * @param {int} x
	 * @param {int} y
	 * @param {int} size
	 * @param {string} type circle, rect
	 */
	show_mouse_cursor(x: number, y: number, size:number, type: "circle" | "rect") {

		//fix coordinates, because of scroll
		const start_pos = this.Base_layers.get_world_coords(0, 0);
		x = x - start_pos.x;
		y = y - start_pos.y;

		const element = document.getElementById("mouse");
		if (!element) return;
		size = size * config.ZOOM;
		x = x * config.ZOOM;
		y = y * config.ZOOM;

		if (size < 5) {
			//too small
			element.className = "";
			return;
		}

		element.style.width = `${size  }px`;
		element.style.height = `${size  }px`;

		element.style.left = `${x - Math.ceil(size / 2)  }px`;
		element.style.top = `${y - Math.ceil(size / 2)  }px`;

		//add style
		element.className = "";
		element.classList.add(type);
	}

	getParams() {
		const params = {} as Params;
		// Number inputs return the .value if defined as objects.
		for (const attributeName in config.TOOL.attributes) {
			const attribute = config.TOOL.attributes[attributeName];
			if (!isNaN(attribute.value) && attribute.value != null) {
				if (typeof attribute.value === "string") {
					params[attributeName] = attribute;
				} else {
					params[attributeName] = attribute.value;
				}
			} else {
				params[attributeName] = attribute;
			}
		}
		return params;
	}

	adaptSize(value: number, type = "width") {
		let response;
		if (config.layer.width_original == null) {
			return value;
		}

		if (type === "width") {
			response = value / (config.layer.width / config.layer.width_original);
		}
		else {
			response = value / (config.layer.height / config.layer.height_original);
		}

		return response;
	}

	draw_shape(ctx: CanvasRenderingContext2D , x: number, y: number, width: number, height: number, coords: any, is_demo: boolean = false) {
		if(is_demo !== false) {
			ctx.fillStyle = "#aaa";
			ctx.strokeStyle = "#555";
			ctx.lineWidth = 2;
		}
		ctx.lineJoin = "round";

		ctx.beginPath();
		for(const i in coords){
			if(coords[i] === null){
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				continue;
			}

			//coords in 100x100 box
			const pos_x = x + coords[i][0] * width / 100;
			const pos_y = y + coords[i][1] * height / 100;

			if(i == "0")
				ctx.moveTo(pos_x, pos_y);
			else
				ctx.lineTo(pos_x, pos_y);
		}
		ctx.closePath();

		ctx.fill();
		ctx.stroke();
	}

	default_events(){
		const _this = this;

		//mouse events
		document.addEventListener("mousedown", function (event) {
			_this.default_dragStart(event);
		});
		document.addEventListener("mousemove", function (event) {
			_this.default_dragMove(event);
		});
		document.addEventListener("mouseup", function (event) {
			_this.default_dragEnd(event);
		});

		// collect touch events
		/* document.addEventListener("touchstart", function (event) {
			_this.default_dragStart(event);
		});
		document.addEventListener("touchmove", function (event) {
			_this.default_dragMove(event);
		});
		document.addEventListener("touchend", function (event) {
			_this.default_dragEnd(event);
		}); */
	}

	default_dragStart(event: MouseEvent) {
		if (config.TOOL.name != this.name)
			return;
		this.mousedown(event);
	}
	mousedown(event: MouseEvent) {
		throw new Error("Method not implemented.");
	}

	default_dragMove(event: MouseEvent) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);
	}
	mousemove(event: MouseEvent) {
		throw new Error("Method not implemented.");
	}

	default_dragEnd(event : MouseEvent) {
		if (config.TOOL.name != this.name)
			return;
		this.mouseup(event);
	}
	mouseup(event: MouseEvent) {
		throw new Error("Method not implemented.");
	}

	async shape_mousedown(e: MouseEvent) {
		const mouse = this.get_mouse_info(e);

		let mouse_x = mouse.x;
		let mouse_y = mouse.y;

		//apply snap
		const snap_info = this.calc_snap_position(e, mouse_x, mouse_y);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}

		this.shape_mouse_click.x = mouse_x;
		this.shape_mouse_click.y = mouse_y;

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()) as Params,
			status: "draft",
			render_function: [this.name, "render"],
			x: Math.round(mouse_x),
			y: Math.round(mouse_y),
			color: "",
			is_vector: true,
			height: 0,
			width: 0,
			width_original: 0,
			height_original: 0,
			visible: true,
			rotate: 0,
			opacity: 1,
			composition: "source-over",
			id: 0,
			name: "",
			parent_id: 0,
			hide_selection_if_active: false,
			order: 0,
			filters: [],
		};
		await app.State?.do_action(
			new app.Actions.Bundle_action(`new_${this.name}_layer`, `New ${this.Helper.ucfirst(this.name)} Layer`, [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
	}

	shape_mousemove(e: MouseEvent) {
		const mouse = this.get_mouse_info(e);
		const params = this.getParams();

		let mouse_x = Math.round(mouse.x);
		let mouse_y = Math.round(mouse.y);
		const click_x = Math.round(this.shape_mouse_click.x);
		const click_y = Math.round(this.shape_mouse_click.y);

		//apply snap
		const snap_info = this.calc_snap_position(e, mouse_x, mouse_y, config.layer.id);
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

		if (e.ctrlKey == true || e.metaKey) {
			if (width  < height * this.best_ratio) {
				width = height * this.best_ratio;
			}
			else {
				height = width / this.best_ratio;
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

	shape_mouseup(e: MouseEvent) {
		const mouse = this.get_mouse_info(e);
		const params = this.getParams();

		let mouse_x = Math.round(mouse.x);
		let mouse_y = Math.round(mouse.y);
		const click_x = Math.round(this.shape_mouse_click.x);
		const click_y = Math.round(this.shape_mouse_click.y);

		//apply snap
		const snap_info = this.calc_snap_position(e, mouse_x, mouse_y, config.layer.id);
		if(snap_info != null){
			if(snap_info.x != null) {
				mouse_x = snap_info.x;
			}
			if(snap_info.y != null) {
				mouse_y = snap_info.y;
			}
		}
		this.snap_line_info = {x: {
			start_x: 0,
			start_y: 0,
			end_x: 0,
			end_y: 0,
		}, y: {
			start_x: 0,
			start_y: 0,
			end_x: 0,
			end_y: 0,
		}};

		let x = Math.min(mouse_x, click_x);
		let y = Math.min(mouse_y, click_y);
		let width = Math.abs(mouse_x - click_x);
		let height = Math.abs(mouse_y - click_y);

		if (e.ctrlKey == true || e.metaKey) {
			if (width  < height * this.best_ratio) {
				width = height * this.best_ratio;
			}
			else {
				height = width / this.best_ratio;
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
				x,
				y,
				width,
				height,
				status: "null"
			} as Layer),
			{ merge_with_history: `new_${this.name}_layer` }
		);
	}

	render_overlay_parent(ctx: CanvasRenderingContext2D){
		//x
		if(this.snap_line_info.x !== null) {
			this.Helper.draw_special_line(
				ctx,
				this.snap_line_info.x.start_x,
				this.snap_line_info.x.start_y,
				this.snap_line_info.x.end_x,
				this.snap_line_info.x.end_y
			);
		}

		//y
		if(this.snap_line_info.y !== null) {
			this.Helper.draw_special_line(
				ctx,
				this.snap_line_info.y.start_x,
				this.snap_line_info.y.start_y,
				this.snap_line_info.y.end_x,
				this.snap_line_info.y.end_y
			);
		}
	}

	get_snap_positions(exclude_id?: number) {
		const snap_positions = {
			x: [
				0,
				config.WIDTH/2,
				config.WIDTH,
			],
			y: [
				0,
				config.HEIGHT/2,
				config.HEIGHT,
			],
		};
		if(config.guides_enabled == true){
			//use guides
			for(let i in config.guides){
				const guide = config.guides[i];
				if(guide.y === null)
					snap_positions.x.push(guide.x);
				else
					snap_positions.y.push(guide.y);
			}
		}
		for(let i in config.layers){
			if(exclude_id != null && exclude_id == config.layers[i].id){
				continue;
			}
			if(config.layers[i].visible == false
				|| config.layers[i].x === null || config.layers[i].y === null
				|| config.layers[i].width === null || config.layers[i].height === null){
				continue;
			}

			//x
			let x = config.layers[i].x;
			if(x > 0 && x < config.WIDTH)
				snap_positions.x.push(x);

			x = config.layers[i].x + config.layers[i].width/2;
			if(x > 0 && x < config.WIDTH)
				snap_positions.x.push(x);

			x = config.layers[i].x + config.layers[i].width;
			if(x > 0 && x < config.WIDTH)
				snap_positions.x.push(x);

			//y
			let y = config.layers[i].y;
			if(y > 0 && y < config.HEIGHT)
				snap_positions.y.push(y);

			y = config.layers[i].y + config.layers[i].height/2;
			if(y > 0 && y < config.HEIGHT)
				snap_positions.y.push(y);

			y = config.layers[i].y + config.layers[i].height;
			if(y > 0 && y < config.HEIGHT)
				snap_positions.y.push(y);
		}

		return snap_positions;
	}

	/**
	 * calculates snap coordinates by current mouse position.
	 *
	 * @param event
	 * @param pos_x
	 * @param pos_y
	 * @param exclude_id
	 * @returns object|null
	 */
	calc_snap_position(event: MouseEvent, pos_x: number, pos_y: number, exclude_id?: number) {
		const snap_position = { x: 0, y: 0 };
		const params = this.getParams();

		if(config.SNAP === "" || event.shiftKey == true || (event.ctrlKey == true || event.metaKey == true)){
			this.snap_line_info ={
				x: {
					start_x: 0,
					start_y: 0,
					end_x: 0,
					end_y: 0,
				},
				y: {
					start_x: 0,
					start_y: 0,
					end_x: 0,
					end_y: 0,
				}
			}
			return null;
		}

		//settings
		const sensitivity = 0.01;
		const max_distance = (config.WIDTH + config.HEIGHT) / 2 * sensitivity / config.ZOOM;

		//collect snap positions
		let get_snap_positions = () => {
			if(typeof exclude_id != "undefined")
				return this.get_snap_positions(exclude_id);
			else
				return this.get_snap_positions();
		}
		const snap_positions = get_snap_positions();
		

		//find closest snap positions
		const min_value = {
			x: 0,
			y: 0,
		};
		const min_distance = {
			x: 0,
			y: 0,
		};
		//x
		for(let i in snap_positions.x){
			let distance = Math.abs(pos_x - snap_positions.x[i]);
			if(distance < max_distance && (distance < min_distance.x || min_distance.x === null)){
				min_distance.x = distance;
				min_value.x = snap_positions.x[i];
			}
		}
		//y
		for(let i in snap_positions.y){
			let distance = Math.abs(pos_y - snap_positions.y[i]);
			if(distance < max_distance && (distance < min_distance.y || min_distance.y === null)){
				min_distance.y = distance;
				min_value.y = snap_positions.y[i];
			}
		}

		//apply snap
		let success = false;

		//x
		if(min_value.x != null) {
			snap_position.x = Math.round(min_value.x);
			success = true;
			this.snap_line_info.x = {
				start_x: min_value.x,
				start_y: 0,
				end_x: min_value.x,
				end_y: config.HEIGHT
			};
		}
		else{
			this.snap_line_info.x = {
				start_x: 0,
				start_y: 0,
				end_x: 0,
				end_y: 0,
			};
		}
		//y
		if(min_value.y != null) {
			snap_position.y = Math.round(min_value.y);
			success = true;
			this.snap_line_info.y = {
				start_x: 0,
				start_y: min_value.y,
				end_x: config.WIDTH,
				end_y: min_value.y,
			};
		}
		else{
			this.snap_line_info.y = {
				start_x: 0,
				start_y: 0,
				end_x: 0,
				end_y: 0,
			};
		}

		if(success) {
			return snap_position;
		}

		return null;
	}

}
export default Base_tools_class;
