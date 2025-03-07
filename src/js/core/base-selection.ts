/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import { Layer } from "../../../types/types";
import config from "../config";

let instance: Base_selection_class | null = null;
const settings_all: {
	[x: string]: {
		enable_background: boolean;
		enable_borders: boolean;
		enable_controls: boolean;
		enable_rotation: boolean;
		enable_move: boolean;
		data_function: (() => null) | (() => any) | (() => any) | (() => any) | (() => any) | (() => any);
		crop_lines?: boolean;
		keep_ratio?: boolean;
		data: any;
	};
} = {};

const handle_size = 12;

const DRAG_TYPE_TOP = 1;
const DRAG_TYPE_BOTTOM = 2;
const DRAG_TYPE_LEFT = 4;
const DRAG_TYPE_RIGHT = 8;

/**
 * Selection class - draws rectangular selection on canvas, can be resized.
 */
class Base_selection_class {
	private readonly ctx!: CanvasRenderingContext2D;
	mouse_lock: string | undefined;
	selected_obj_positions: {
		[x: string]: {
			cursor: string;
			path: Path2D;
		};
	} | undefined;
	selected_obj_rotate_position: {
		cursor: string;
		path: Path2D;
	} | undefined;
	selected_object_drag_type: number | undefined;
	click_details: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | undefined;
	is_drag: boolean | undefined;
	is_touch: boolean | undefined;
	current_angle: number | undefined;

	/**
	 * settings:
	 * - enable_background
	 * - enable_borders
	 * - enable_controls
	 * - enable_rotation
	 * - enable_move
	 * - keep_ratio
	 * 
	 * @param {ctx} ctx
	 * @param {object} settings
	 * @param {string|null} key
	 */
	constructor(ctx: CanvasRenderingContext2D, settings?: Layer | undefined, key?: string) {
		if (key != null) {
			// @ts-ignore
			settings_all[key] = settings;
		}

		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.ctx = ctx;
		this.is_touch = false;
		// True if dragging from inside canvas area
		this.is_drag = false;

		this.events();
	}

	events() {
		document.addEventListener("mousedown", (e) => {
			this.is_drag = false;
			if (this.is_touch == true)
				return;
			if (!(e.target as HTMLElement).closest("#main_wrapper"))
				return;
			this.is_drag = true;
			this.selected_object_actions(e);
		});
		document.addEventListener("mousemove", (e) => {
			if (this.is_touch == true)
				return;
			this.selected_object_actions(e);
		});
		document.addEventListener("mouseup", (e) => {
			if (this.is_touch == true)
				return;
			this.selected_object_actions(e);
		});

		// touch
/* 		document.addEventListener("touchstart", (event) => {
			this.is_drag = false;
			this.is_touch = true;
			if (!event.target.closest("#main_wrapper"))
				return;
			this.is_drag = true;
			this.selected_object_actions(event);
		});
		document.addEventListener("touchmove", (event) => {
			this.selected_object_actions(event);
		}, { passive: false });
		document.addEventListener("touchend", (event) => {
			this.selected_object_actions(event);
		}); */
	}

	set_selection(x: number | null, y: number | null, width: number | null, height: number | null) {
		const settings = this.find_settings();

		if (x != null)
			settings.data.x = x;
		if (y != null)
			settings.data.y = y;
		if (width != null)
			settings.data.width = width;
		if (height != null)
			settings.data.height = height;
		config.need_render = true;
	}

	reset_selection() {
		const settings = this.find_settings();

		settings.data = {
			x: null,
			y: null,
			width: null,
			height: null,
		};
		config.need_render = true;
	}

	get_selection() {
		const settings = this.find_settings();

		return settings.data;
	}

	find_settings() {
		const current_key = config.TOOL.name;
		let settings = null;

		for (const i in settings_all) {
			if (i == current_key)
				settings = settings_all[i];
		}

		//default
		if (settings === null) {
			settings = settings_all["main"];
		}

		//find data
		// @ts-ignore
		settings.data = (settings.data_function).call();

		return settings;
	}

	calcRotateDistanceFromX(layerW: number) {
		const block_size = handle_size / config.ZOOM;

		return Math.max(
			Math.min(layerW * 0.9, Math.abs(layerW - 2 * block_size)),
			layerW / 2 - block_size / 2
		);
	}
	/**
	 * marks object as selected, and draws corners
	 */
	draw_selection() {

		if (this.ctx == null) {
			return;
		}

		const settings = this.find_settings();
		const data = settings.data;

		if (settings.data === null || settings.data.status == "draft"
			|| (settings.data.hide_selection_if_active === true && settings.data.type == config.TOOL.name)) {
			return;
		}

		let x = settings.data.x;
		let y = settings.data.y;
		let w = settings.data.width;
		let h = settings.data.height;

		if (x == null || y == null || w == null || h == null) {
			//not supported 
			return;
		}

		const block_size_default = handle_size / config.ZOOM;

		if (config.ZOOM != 1) {
			x = Math.round(x);
			y = Math.round(y);
			w = Math.round(w);
			h = Math.round(h);
		}
		const block_size = block_size_default;
		const corner_offset = (block_size / 2.4);
		const middle_offset = (block_size / 1.9);

		this.ctx.save();
		this.ctx.globalAlpha = 1;
		let isRotated = false;
		if (data.rotate != null && data.rotate != 0) {
			//rotate
			isRotated = true;
			this.ctx.translate(data.x + data.width / 2, data.y + data.height / 2);
			this.ctx.rotate(data.rotate * Math.PI / 180);
			x = Math.round(-data.width / 2);
			y = Math.round(-data.height / 2);
		}

		//fill
		if (settings.enable_background == true) {
			this.ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
			this.ctx.fillRect(x, y, w, h);
		}

		const wholeLineWidth = 2 / config.ZOOM;
		const halfLineWidth = wholeLineWidth / 2;

		//borders
		if (settings.enable_borders == true && (x != 0 || y != 0 || w != config.WIDTH || h != config.HEIGHT)) {
			this.ctx.lineWidth = wholeLineWidth;
			this.ctx.strokeStyle = "rgb(255, 255, 255)";
			this.ctx.strokeRect(x - halfLineWidth, y - halfLineWidth, w + wholeLineWidth, h + wholeLineWidth);
			this.ctx.lineWidth = halfLineWidth;
			this.ctx.strokeStyle = "rgb(0, 0, 0)";
			this.ctx.strokeRect(x - wholeLineWidth, y - wholeLineWidth, w + (wholeLineWidth * 2), h + (wholeLineWidth * 2));
		}

		//show crop lines
		if (settings.crop_lines === true) {

			for (let part = 1; part < 3; part++) {
				this.ctx.lineWidth = wholeLineWidth;
				this.ctx.strokeStyle = "rgb(255, 255, 255)";
				this.ctx.beginPath();
				this.ctx.moveTo(x + w / 3 * part - halfLineWidth, y);
				this.ctx.lineTo(x + w / 3 * part - halfLineWidth, y + h);
				this.ctx.stroke();

				this.ctx.lineWidth = halfLineWidth;
				this.ctx.strokeStyle = "rgb(0, 0, 0)";
				this.ctx.beginPath();
				this.ctx.moveTo(x + w / 3 * part - halfLineWidth, y);
				this.ctx.lineTo(x + w / 3 * part - halfLineWidth, y + h);
				this.ctx.stroke();
			}

			for (let part = 1; part < 3; part++) {
				this.ctx.lineWidth = wholeLineWidth;
				this.ctx.strokeStyle = "rgb(255, 255, 255)";
				this.ctx.beginPath();
				this.ctx.moveTo(x, y + h / 3 * part - halfLineWidth);
				this.ctx.lineTo(x + w, y + h / 3 * part - halfLineWidth);
				this.ctx.stroke();

				this.ctx.lineWidth = halfLineWidth;
				this.ctx.strokeStyle = "rgb(0, 0, 0)";
				this.ctx.beginPath();
				this.ctx.moveTo(x, y + h / 3 * part - halfLineWidth);
				this.ctx.lineTo(x + w, y + h / 3 * part - halfLineWidth);
				this.ctx.stroke();
			}
		}

		const hitsLeftEdge = isRotated ? false : x < handle_size;
		const hitsTopEdge = isRotated ? false : y < handle_size;
		const hitsRightEdge = isRotated ? false : x + w > config.WIDTH - handle_size;
		const hitsBottomEdge = isRotated ? false : y + h > config.HEIGHT - handle_size;

		//draw corners
		const corner = (x: number, y: number, dx: number, dy: number, drag_type: number, cursor: string) => {
			let angle = 0;

			if (this.ctx == null) {
				return;
			}

			if (settings.data.rotate != null && settings.data.rotate != 0) {
				angle = settings.data.rotate;
			}

			if (settings.enable_controls == false || angle != 0) {
				this.ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
				this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
			}
			else {
				this.ctx.strokeStyle = "#000000";
				this.ctx.fillStyle = "#ffffff";
			}
			this.ctx.lineWidth = wholeLineWidth;

			//create path
			const circle = new Path2D();
			circle.arc(x + dx * block_size, y + dy * block_size, block_size / 2, 0, 2 * Math.PI);

			//draw
			this.ctx.fill(circle);
			this.ctx.stroke(circle);

			//register position
			// @ts-ignore
			this.selected_obj_positions ? [drag_type] = {
				cursor: cursor,
				path: circle,
			} : null;
		}

		//draw rotation
		const draw_rotation = () => {


			const settings = this.find_settings();

			if (settings.data === null
				|| settings.data.status == "draft"
				|| settings.data.rotate === null
				|| (settings.data.hide_selection_if_active === true && settings.data.type == config.TOOL.name)) {
				return;
			}

			const r_x = x + this.calcRotateDistanceFromX(w) + corner_offset + wholeLineWidth;
			const r_y = y - corner_offset - wholeLineWidth;
			const r_dx = hitsRightEdge ? -0.5 : 0;
			const r_dy = hitsTopEdge ? 0.5 : 0;

			this.ctx.strokeStyle = "#000000";
			this.ctx.fillStyle = "#d0d62a";
			this.ctx.lineWidth = wholeLineWidth;

			//create path
			const circle = new Path2D();
			circle.arc(r_x + r_dx * block_size, r_y + r_dy * block_size, block_size / 2, 0, 2 * Math.PI);

			//draw
			this.ctx.fill(circle);
			this.ctx.stroke(circle);

			//register position
			this.selected_obj_rotate_position = {
				cursor: "pointer",
				path: circle,
			};

		};
		if (settings.enable_rotation == true) {
			draw_rotation();
		}

		if (settings.enable_controls == true) {
			corner(x - corner_offset - wholeLineWidth, y - corner_offset - wholeLineWidth, hitsLeftEdge ? 0.5 : 0, hitsTopEdge ? 0.5 : 0, DRAG_TYPE_LEFT | DRAG_TYPE_TOP, "nwse-resize");
			corner(x + w + corner_offset + wholeLineWidth, y - corner_offset - wholeLineWidth, hitsRightEdge ? -0.5 : 0, hitsTopEdge ? 0.5 : 0, DRAG_TYPE_RIGHT | DRAG_TYPE_TOP, "nesw-resize");
			corner(x - corner_offset - wholeLineWidth, y + h + corner_offset + wholeLineWidth, hitsLeftEdge ? 0.5 : 0, hitsBottomEdge ? -0.5 : 0, DRAG_TYPE_LEFT | DRAG_TYPE_BOTTOM, "nesw-resize");
			corner(x + w + corner_offset + wholeLineWidth, y + h + corner_offset + wholeLineWidth, hitsRightEdge ? -0.5 : 0, hitsBottomEdge ? -0.5 : 0, DRAG_TYPE_RIGHT | DRAG_TYPE_BOTTOM, "nwse-resize");
		}

		if (settings.enable_controls == true) {
			//draw centers
			if (Math.abs(w) > block_size * 5) {
				corner(x + w / 2, y - middle_offset - wholeLineWidth, 0, hitsTopEdge ? 0.5 : 0, DRAG_TYPE_TOP, "ns-resize");
				corner(x + w / 2, y + h + middle_offset + wholeLineWidth, 0, hitsBottomEdge ? -0.5 : 0, DRAG_TYPE_BOTTOM, "ns-resize");
			}
			if (Math.abs(h) > block_size * 5) {
				corner(x - middle_offset - wholeLineWidth, y + h / 2, hitsLeftEdge ? 0.5 : 0, 0, DRAG_TYPE_LEFT, "ew-resize");
				corner(x + w + middle_offset + wholeLineWidth, y + h / 2, hitsRightEdge ? -0.5 : 0, 0, DRAG_TYPE_RIGHT, "ew-resize");
			}
		}

		//restore
		this.ctx.restore();
	}

	selected_object_actions(e: MouseEvent) {
		const settings = this.find_settings();
		const data = settings.data;

		if (data == null) {
			return;
		}

		this.ctx.save();
		if (data.rotate != null && data.rotate != 0) {
			this.ctx.translate(data.x + data.width / 2, data.y + data.height / 2);
			this.ctx.rotate(data.rotate * Math.PI / 180);
		}

		const x = settings.data.x;
		const y = settings.data.y;
		const w = settings.data.width;
		const h = settings.data.height;

		//simplify checks
		let event_type = e.type;
		if (event_type == "touchstart") event_type = "mousedown";
		if (event_type == "touchmove") event_type = "mousemove";
		if (event_type == "touchend") event_type = "mouseup";

		if (!this.is_drag && ["mousedown", "mouseup"].includes(event_type))
			return;

		const mainWrapper = document.getElementById("main_wrapper") as HTMLDivElement;
		const defaultCursor = config.TOOL && config.TOOL.name === "text" ? "text" : "default";
		if (mainWrapper.style.cursor !== defaultCursor) {
			mainWrapper.style.cursor = defaultCursor;
		}
		if (event_type == "mousedown" && config.mouse || settings.enable_controls == false) {
			return;
		}

		const mouse = config.mouse;
		const drag_type = this.selected_object_drag_type ?? 0;

		if (event_type == "mousedown" && settings.data !== null) {
			this.click_details = {
				x: settings.data.x,
				y: settings.data.y,
				width: settings.data.width,
				height: settings.data.height,
			};
			this.current_angle = undefined;
		}
		if (event_type == "mousemove" && this.mouse_lock == "selected_object_actions" && this.is_drag) {

			const allowNegativeDimensions = settings.data.render_function
				&& ["line", "arrow", "gradient"].includes(settings.data.render_function[0]);

			mainWrapper.style.cursor = "pointer";

			let is_ctrl = false;
			if (e.ctrlKey == true || e.metaKey) {
				is_ctrl = true;
			}

			const is_drag_type_left = Math.floor(drag_type / DRAG_TYPE_LEFT) % 2 === 1;
			const is_drag_type_right = Math.floor(drag_type / DRAG_TYPE_RIGHT) % 2 === 1;
			const is_drag_type_top = Math.floor(drag_type / DRAG_TYPE_TOP) % 2 === 1;
			const is_drag_type_bottom = Math.floor(drag_type / DRAG_TYPE_BOTTOM) % 2 === 1;

			if (is_drag_type_left && is_drag_type_top) mainWrapper.style.cursor = "nwse-resize";
			else if (is_drag_type_top && is_drag_type_right) mainWrapper.style.cursor = "nesw-resize";
			else if (is_drag_type_right && is_drag_type_bottom) mainWrapper.style.cursor = "nwse-resize";
			else if (is_drag_type_bottom && is_drag_type_left) mainWrapper.style.cursor = "nesw-resize";
			else if (is_drag_type_top) mainWrapper.style.cursor = "ns-resize";
			else if (is_drag_type_right) mainWrapper.style.cursor = "ew-resize";
			else if (is_drag_type_bottom) mainWrapper.style.cursor = "ns-resize";
			else if (is_drag_type_left) mainWrapper.style.cursor = "ew-resize";

			// @ts-ignore
			if (drag_type == "rotate") {
				//rotate
				let dx = x + this.calcRotateDistanceFromX(w) - (x + w / 2);
				let dy = h / 2;
				const original_angle = Math.atan2(dy, dx) / Math.PI * 180; //compensate rotation icon angle

				dx = mouse.x - (x + w / 2);
				dy = mouse.y - (y + h / 2);
				const angle = Math.atan2(dy, dx) / Math.PI * 180 + original_angle;

				//settings.data.rotate = angle;
				this.current_angle = angle;

				config.need_render = true;
			}
			else if ((e.buttons == 1 || typeof e.buttons == "undefined") && this.click_details) {
				// Do transformations
				let dx = Math.round(mouse.x - mouse.click_x);
				let dy = Math.round(mouse.y - mouse.click_y);
				let width = this.click_details.width + dx;
				let height = this.click_details.height + dy;
				if (is_drag_type_top)
					height = this.click_details.height - dy;
				if (is_drag_type_left)
					width = this.click_details.width - dx;

				// Keep ratio - (if drag_type power of 2, only dragging on single axis)
				if (drag_type && (drag_type & (drag_type - 1)) !== 0 && (settings.keep_ratio == true && is_ctrl == false)
					|| (settings.keep_ratio !== true && is_ctrl == true)) {
					const ratio = this.click_details.width / this.click_details.height;
					const width_new = Math.round(height * ratio);
					const height_new = Math.round(width / ratio);

					if (Math.abs(width * 100 / width_new) > Math.abs(height * 100 / height_new)) {
						height = height_new;
					}
					else {
						width = width_new;
					}
				}

				// Set values
				settings.data.x = this.click_details.x;
				settings.data.y = this.click_details.y;
				if (is_drag_type_top)
					settings.data.y = this.click_details.y - (height - this.click_details.height);
				if (is_drag_type_left)
					settings.data.x = this.click_details.x - (width - this.click_details.width);
				if (is_drag_type_left || is_drag_type_right)
					settings.data.width = width;
				if (is_drag_type_top || is_drag_type_bottom)
					settings.data.height = height;

				// Don't allow negative width/height on most layers
				if (!allowNegativeDimensions) {
					if (settings.data.width <= 0) {
						settings.data.width = Math.abs(settings.data.width);
						if (is_drag_type_left) {
							settings.data.x -= settings.data.width;
						} else {
							settings.data.x = this.click_details.x - settings.data.width;
						}
					}
					if (settings.data.height <= 0) {
						settings.data.height = Math.abs(settings.data.height);
						if (is_drag_type_top) {
							settings.data.y -= settings.data.height;
						} else {
							settings.data.y = this.click_details.y - settings.data.height;
						}
					}
				}
				config.need_render = true;
			}
			return;
		}
		if (event_type == "mouseup" && this.mouse_lock == "selected_object_actions") {
			//reset
			// @ts-ignore
			this.mouse_lock = null;
		}

		if (!this.mouse_lock) {
			//set mouse move cursor
			if (settings.enable_move && mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h) {
				mainWrapper.style.cursor = "move";
			}

			for (const current_drag_type in this.selected_obj_positions) {
				const position = this.selected_obj_positions[current_drag_type];
				if (position.path && this.ctx.isPointInPath(position.path, mouse.x, mouse.y)) {
					// match
					if (event_type == "mousedown") {
						if (e.buttons == 1 || typeof e.buttons == "undefined") {
							this.mouse_lock = "selected_object_actions";
							this.selected_object_drag_type = parseInt(current_drag_type);
						}
					}
					if (event_type == "mousemove") {
						mainWrapper.style.cursor = position.cursor;
					}
				}
			}

			//rotate?
			const position = this.selected_obj_rotate_position;
			if (position && position.path && this.ctx.isPointInPath(position.path, mouse.x, mouse.y)) {
				//match
				if (event_type == "mousedown") {
					if (e.buttons == 1 || typeof e.buttons == "undefined") {
						this.mouse_lock = "selected_object_actions";
						// @ts-ignore
						this.selected_object_drag_type = "rotate";
					}
				}
				if (event_type == "mousemove") {
					mainWrapper.style.cursor = position.cursor;
				}
			}

			this.ctx.restore();
		}
	}

}

export default Base_selection_class;
