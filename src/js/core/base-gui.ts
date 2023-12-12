/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from "../config";
import Base_layers_class from "./base-layers";
import GUI_tools_class from "./gui/gui-tools";
import GUI_preview_class from "./gui/gui-preview";
import GUI_colors_class from "./gui/gui-colors";
import GUI_layers_class from "./gui/gui-layers";
import GUI_information_class from "./gui/gui-information";
import GUI_details_class from "./gui/gui-details";
import GUI_menu_class from "./gui/gui-menu";
import Tools_translate_class from "../modules/tools/translate";
import Tools_settings_class from "../modules/tools/settings";
import Helper_class from "../libs/helpers";

let instance: Base_gui_class | null = null;

/**
 * Main GUI class
 */
class Base_gui_class {

	
	

	last_menu: string = "";
	grid_size: number[] = [50, 50];
	grid: boolean = false;
	canvas_offset: { x: number, y: number } = { x: 0, y: 0 };

	common_dimensions: (number | string)[][] = [
		[640, 480, "480p"],
		[800, 600, "SVGA"],
		[1024, 768, "XGA"],
		[1280, 720, "hdtv, 720p"],
		[1600, 1200, "UXGA"],
		[1920, 1080, "Full HD, 1080p"],
		[3840, 2160, "4K UHD"],
		//[7680,4320, '8K UHD'],
	];

	GUI_tools: GUI_tools_class | undefined;
	GUI_preview: GUI_preview_class | undefined;
	GUI_colors: GUI_colors_class | undefined;
	GUI_layers: GUI_layers_class | undefined;
	GUI_information: GUI_information_class | undefined;
	GUI_details: GUI_details_class | undefined;
	GUI_menu: GUI_menu_class | undefined;

	Tools_translate: Tools_translate_class | undefined;
	Tools_settings: Tools_settings_class | undefined;

	modules: any;
	static GUI_tools: GUI_tools_class;
	static GUI_layers: GUI_layers_class | undefined;
	Helper!: Helper_class;
	Base_layers!: Base_layers_class;


	constructor() {
		console.log("Base_gui_class constructor");
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;
		this.Helper = new Helper_class();
		this.Base_layers = new Base_layers_class();

		//last used menu id
		this.last_menu = "";

		//grid dimensions config
		this.grid_size = [50, 50];

		//if grid is visible
		this.grid = false;

		this.canvas_offset = { x: 0, y: 0 };

		//common image dimensions
		this.common_dimensions = [
			[640, 480, "480p"],
			[800, 600, "SVGA"],
			[1024, 768, "XGA"],
			[1280, 720, "hdtv, 720p"],
			[1600, 1200, "UXGA"],
			[1920, 1080, "Full HD, 1080p"],
			[3840, 2160, "4K UHD"],
			//[7680,4320, '8K UHD'],
		];

		this.GUI_tools = new GUI_tools_class();
		this.GUI_preview = new GUI_preview_class(this);
		this.GUI_colors = new GUI_colors_class();
		this.GUI_layers = new GUI_layers_class();
		this.GUI_information = new GUI_information_class();
		this.GUI_details = new GUI_details_class();
		this.GUI_menu = new GUI_menu_class();
		this.Tools_translate = new Tools_translate_class();
		this.Tools_settings = new Tools_settings_class();
		this.modules = {};
	}

	init() {
		this.load_modules();
		this.load_default_values();
		this.render_main_gui();
		this.init_service_worker();
	}

	load_modules() {
		const _this = this;
		// @ts-ignore
		const modules_context = require.context("./../modules/", true, /\$/);
		modules_context.keys().forEach(function (key: string) {
			if (key.indexOf("Base" + "/") < 0) {
				const moduleKey = key.replace("./", "").replace("", "");
				const classObj = modules_context(key);
				_this.modules[moduleKey] = new classObj.default();
			}
		});
	}

	load_default_values() {
		//transparency
		const transparency_cookie = this.Helper.getCookie("transparency");
		if (transparency_cookie === null) {
			//default
			// @ts-ignore
			config.TRANSPARENCY = false;
		}
		if (transparency_cookie) {
			// @ts-ignore
			config.TRANSPARENCY = true;
		}
		else {
			// @ts-ignore
			config.TRANSPARENCY = false;
		}

		//transparency_type
		const transparency_type = this.Helper.getCookie("transparency_type");
		if (transparency_type === null) {
			//default
			config.TRANSPARENCY_TYPE = "squares";
		}
		if (transparency_type) {
			config.TRANSPARENCY_TYPE = transparency_type;
		}

		//snap
		const snap_cookie = this.Helper.getCookie("snap");
		if (snap_cookie === null) {
			//default
			config.SNAP = String(true);
		}
		else {
			config.SNAP = String(Boolean(snap_cookie));
		}

		//guides
		const guides_cookie = this.Helper.getCookie("guides");
		if (guides_cookie === null) {
			//default
			config.guides_enabled = true;
		}
		else {
			config.guides_enabled = Boolean(guides_cookie);
		}
	}

	render_main_gui() {
		this.autodetect_dimensions();

		this.change_theme();
		this.prepare_canvas();
		this.GUI_tools?.render_main_tools();
		this.GUI_preview?.render_main_preview();
		this.GUI_colors?.render_main_colors();
		this.GUI_layers?.render_main_layers();
		this.GUI_information?.render_main_information();
		this.GUI_details?.render_main_details();
		this.GUI_menu?.render_main();
		this.load_saved_changes();

		this.set_events();
		this.load_translations();
	}

	init_service_worker() {
		/*if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('./service-worker').then(function(reg) {
				//Successfully registered service worker
			}).catch(function(err) {
				console.warn('Error registering service worker', err);
			});
		}*/
	}

	set_events() {
		const _this = this;

		//menu events
		this.GUI_menu?.on("select_target", (target: string, object: { parameter: null; }) => {
			const parts = target.split(".");
			const module = parts[0];
			const function_name = parts[1];
			const param = object.parameter ??= null;

			//call module
			if (this.modules[module] == undefined) {
				alert(`Modules class not found: ${module}`);
				return;
			}
			if (this.modules[module][function_name] == undefined) {
				alert(`Module function not found. ${module}.${function_name}`);
				return;
			}
			this.modules[module][function_name](param);
		});

		//registerToggleAbility
		const targets = document.querySelectorAll(".toggle") as NodeListOf<HTMLDivElement>;
		for (let i = 0; i < targets.length; i++) {
			if ((targets[i]as HTMLDivElement).dataset .target == undefined)
				continue;
			targets[i].addEventListener("click", function (event) {
				this.classList.toggle("toggled");
				const target = document.getElementById(this.dataset.target ?? "");
				target?.classList.toggle("hidden");
				//save
				// @ts-ignore
				if (target.classList.contains("hidden") == false)
				// @ts-ignore
					_this.Helper.setCookie(this.dataset.target, 1);
				else
				// @ts-ignore
					_this.Helper.setCookie(this.dataset.target, 0);
			});
		}

		document.getElementById("left_mobile_menu_button")?.addEventListener("click", function (event) {
			document.querySelector(".sidebar_left")?.classList.toggle("active");
		});
		document.getElementById("mobile_menu_button")?.addEventListener("click", function (event) {
			document.querySelector(".sidebar_right")?.classList.toggle("active");
		});
		window.addEventListener("resize", function (event) {
			//resize
			_this.prepare_canvas();
			config.need_render = true;
		}, false);
		this.check_canvas_offset();

		//confirmation on exit
		const exit_confirm = this.Tools_settings?.get_setting("exit_confirm");
		window.addEventListener("beforeunload", function (e) {
			if (exit_confirm && (config.layers.length > 1 || _this.Base_layers.is_layer_empty(config.layer.id) == false)) {
				e.preventDefault();
				e.returnValue = "";
			}
			return undefined;
		});

		document.getElementById("canvas_minipaint")?.addEventListener("contextmenu", function (e) {
			e.preventDefault();
		}, false);
	}

	check_canvas_offset() {
		//calc canvas position offset
		const bodyRect = document.body.getBoundingClientRect();
		const canvas_el = document.getElementById("canvas_minipaint")?.getBoundingClientRect() as DOMRect;
		this.canvas_offset.x = canvas_el.left - bodyRect.left;
		this.canvas_offset.y = canvas_el.top - bodyRect.top;
	}

	prepare_canvas() {
		const canvas = document.getElementById("canvas_minipaint") as HTMLCanvasElement;
		const ctx = canvas?.getContext("2d") as CanvasRenderingContext2D;

		const wrapper = document.getElementById("main_wrapper");
		const page_w = wrapper?.clientWidth;
		const page_h = wrapper?.clientHeight;

		const w = Math.min(Math.ceil(config?.WIDTH ?? 0 * config.ZOOM), page_w ?? 0);
		const h = Math.min(Math.ceil(config?.HEIGHT ?? 0 * config.ZOOM), page_h ?? 0);

		canvas.width = w;
		canvas.height = h;

		config.visible_width = w;
		config.visible_height = h;

		if (config.ZOOM >= 1) {
			ctx.imageSmoothingEnabled = false;
		}
		else {
			ctx.imageSmoothingEnabled = true;
		}

		this.render_canvas_background("canvas_minipaint", undefined);

		//change wrapper dimensions
		(document.getElementById("canvas_wrapper") as HTMLCanvasElement).style.width = `${w}px`;
		(document.getElementById("canvas_wrapper") as HTMLCanvasElement).style.height = `${h}px`;

		this.check_canvas_offset();
	}

	load_saved_changes() {
		const targets = document.querySelectorAll(".toggle");
		for (let i = 0; i < targets.length; i++) {
			// @ts-ignore
			if (targets[i].dataset.target == undefined)
				continue;

				// @ts-ignore
			const target = document.getElementById(targets[i].dataset.target);
			// @ts-ignore
			const saved = this.Helper.getCookie(targets[i].dataset.target);
			// @ts-ignore
			if (saved === 0) {
				targets[i].classList.toggle("toggled");
				target?.classList.add("hidden");
			}
		}
	}

	load_translations() {
		let lang = this.Helper.getCookie("language");

		//load from params
		const params = this.Helper.get_url_parameters();
		if (params.lang != undefined) {
			lang = params.lang.replace(/([^a-z]+)/gi, "");
		}

		if (lang != null && lang != config.LANG) {
			config.LANG = lang.replace(/([^a-z]+)/gi, "");
			this.Tools_translate?.translate(config.LANG);
		}
	}

	autodetect_dimensions() {
		const wrapper = document.getElementById("main_wrapper");
		const page_w = wrapper?.clientWidth ?? 0;
		const page_h = wrapper?.clientHeight ?? 0;
		let auto_size = false;

		//use largest possible
		for (let i = this.common_dimensions.length - 1; i >= 0; i--) {
			if ((this.common_dimensions[i][0] as number) > page_w
				|| (this.common_dimensions[i][1] as number) > page_h) {
				//browser size is too small
				continue;
			}
			config.WIDTH = parseInt(this.common_dimensions[i][0].toString());
			config.HEIGHT = parseInt(this.common_dimensions[i][1].toString());
			auto_size = true;
			break;
		}

		if (auto_size == false) {
			//screen size is smaller then 400x300
			config.WIDTH = parseInt(page_w.toString()) - 15;
			config.HEIGHT = parseInt(page_h.toString()) - 10;
		}
	}

	render_canvas_background(canvas_id: string, gap: number | undefined) {
		if (gap == undefined)
			gap = 10;

		const target = document.getElementById(`${canvas_id}_background`) as HTMLCanvasElement;

		// @ts-ignore
		if (config.TRANSPARENCY == false) {
			target.className = "transparent-grid white";
			return false;
		}
		else {
			target.className = `transparent-grid ${config.TRANSPARENCY_TYPE}`;
		}
		target.style.backgroundSize = `${gap * 2}px auto`;
	}

	draw_grid(ctx: CanvasRenderingContext2D) {
		if (!this.grid)
			return;

		let gap_x = this.grid_size[0];
		let gap_y = this.grid_size[1];

		const width = config.WIDTH ?? 0;
		const height = config.HEIGHT ?? 0;

		//size
		if (gap_x != undefined && gap_y != undefined)
			this.grid_size = [gap_x, gap_y];
		else {
			gap_x = this.grid_size[0];
			gap_y = this.grid_size[1];
		}
		gap_x = parseInt(gap_x.toString());
		gap_y = parseInt(gap_y.toString());
		ctx.lineWidth = 1;
		ctx.beginPath();
		if (gap_x < 2)
			gap_x = 2;
		if (gap_y < 2)
			gap_y = 2;
		for (let i = gap_x; i < width; i = i + gap_x) {
			if (gap_x == 0)
				break;
			if (i % (gap_x * 5) == 0) {
				//main lines
				ctx.strokeStyle = "#222222";
			}
			else {
				//small lines
				ctx.strokeStyle = "#bbbbbb";
			}
			ctx.beginPath();
			ctx.moveTo(0.5 + i, 0);
			ctx.lineTo(0.5 + i, height);
			ctx.stroke();
		}
		for (let i = gap_y; i < height; i = i + gap_y) {
			if (gap_y == 0)
				break;
			if (i % (gap_y * 5) == 0) {
				//main lines
				ctx.strokeStyle = "#222222";
			}
			else {
				//small lines
				ctx.strokeStyle = "#bbbbbb";
			}
			ctx.beginPath();
			ctx.moveTo(0, 0.5 + i);
			ctx.lineTo(width, 0.5 + i);
			ctx.stroke();
		}
	}

	draw_guides(ctx: CanvasRenderingContext2D) {
		if (!config.guides_enabled) {
			return;
		}
		const thick_guides = this.Tools_settings?.get_setting("thick_guides");

		for (const guide of config.guides) {

			if (guide.x === 0 || guide.y === 0) {
				continue;
			}

			//set styles
			ctx.strokeStyle = "#00b8b8";
			if (thick_guides == "")
				ctx.lineWidth = 1;
			else
				ctx.lineWidth = 3;

			ctx.beginPath();
			if (guide.y === null) {
				//vertical
				ctx.moveTo(guide.x, 0);
				ctx.lineTo(guide.x, config.HEIGHT);
			}
			if (guide.x === null) {
				//horizontal
				ctx.moveTo(0, guide.y);
				ctx.lineTo(config.WIDTH, guide.y);
			}
			ctx.stroke();
		}
	}

	/**
	 * change draw area size
	 * 
	 * @param {int} width
	 * @param {int} height
	 */
	set_size(width: number, height: number) {
		config.WIDTH = width;
		config.HEIGHT = height;
		this.prepare_canvas();
	}

	/**
	 * 
	 * @returns {object} keys: width, height
	 */
	get_visible_area_size() {
		const wrapper = document.getElementById("main_wrapper");
		const page_w = wrapper?.clientWidth ?? 0;
		const page_h = wrapper?.clientHeight ?? 0;

		//find visible size in pixels, but make sure its correct even if image smaller then screen
		const w = Math.min(Math.ceil(config.WIDTH * config.ZOOM), Math.ceil(page_w / config.ZOOM));
		const h = Math.min(Math.ceil(config.HEIGHT * config.ZOOM), Math.ceil(page_h / config.ZOOM));

		return {
			width: w,
			height: h,
		};
	}

	/**
	 * change theme or set automatically from cookie if possible
	 * 
	 * @param {string} theme_name
	 */
	change_theme(theme_name = "") {
		if (theme_name == "") {
			//auto detect
			const theme_cookie = this.Helper.getCookie("theme");
			if (theme_cookie) {
				theme_name = theme_cookie;
			}
			else {
				theme_name = this.Tools_settings?.get_setting("theme") as string;
			}
		}

		for (const theme of config.themes) {
			document.querySelector("body")?.classList.remove(`theme-${theme}`);
		}
		document.querySelector("body")?.classList.add(`theme-${theme_name}`);
	}

	get_language() {
		return config.LANG;
	}

	get_color() {
		return config.COLOR;
	}

	get_alpha() {
		return config.ALPHA;
	}

	get_zoom() {
		return config.ZOOM;
	}

	get_transparency_support() {
		return config.TRANSPARENCY;
	}

	get_active_tool() {
		return config.TOOL;
	}

}

export default Base_gui_class;
