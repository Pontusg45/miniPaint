import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Base_gui_class from "../../core/base-gui";
import Dialog_class from "../../libs/popup";
import ImageFilters_class from "../../libs/imagefilters";

// @ts-ignore
import Hermite_class from "hermite-resize";

// @ts-ignore
import Pica from "pica";
import Helper_class from "../../libs/helpers";
import Tools_settings_class from "../tools/settings";
import { metaDefaults as textMetaDefaults } from "../../tools/text";
import { ImageFiltersType } from "../../../../types/types";

let instance: Image_resize_class | null = null;

class Image_resize_class {
	Base_layers = new Base_layers_class;
	Base_gui = new Base_gui_class;
	POP: Dialog_class = new Dialog_class;
	ImageFilters = {} as ImageFiltersType;
	Hermite: any;
	Tools_settings = new Tools_settings_class;
	pica: any;
	Helper = new Helper_class;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.POP = new Dialog_class();
		this.ImageFilters = ImageFilters_class;
		this.Hermite = new Hermite_class();
		this.Tools_settings = new Tools_settings_class();
		this.pica = Pica();
		this.Helper = new Helper_class();

		this.set_events();
	}

	set_events() {
		document.addEventListener("keydown", (event) => {
			let code = event.keyCode;
			if (this.Helper.is_input(event.target as HTMLInputElement))
				return;

			if (code == 82 && event.ctrlKey != true && event.metaKey != true) {
				//R - resize
				this.resize();
				event.preventDefault();
			}
		}, false);
	}

	resize() {
		let _this = this;
		let units = this.Tools_settings.get_setting("default_units") as string;
		let resolution = this.Tools_settings.get_setting("resolution") as number;

		//convert units
		let width = this.Helper.get_user_unit(config.WIDTH, units, resolution);
		let height = this.Helper.get_user_unit(config.HEIGHT, units, resolution);

		let settings = {
			title: "Resize",
			params: [
				{name: "width", title: "Width:", value: "", placeholder: width, comment: units},
				{name: "height", title: "Height:", value: "", placeholder: height, comment: units},
				{name: "width_percent", title: "Width (%):", value: "", placeholder: 100, comment: "%"},
				{name: "height_percent", title: "Height (%):", value: "", placeholder: 100, comment: "%"},
				{name: "mode", title: "Mode:", values: ["Lanczos", "Hermite", "Basic"]},

				{name: "sharpen", title: "Sharpen:", value: false},
				{name: "layers", title: "Layers:", values: ["All", "Active"], value: "All"},
			],
			on_finish: function (params: any) {
				_this.do_resize(params);
			},
		};
		this.POP.show(settings as any);
	}

	async do_resize(params: { width: number; height: number; width_percent: number; height_percent: number; layers: string; }) {
		//validate
		if (isNaN(params.width) && isNaN(params.height) && isNaN(params.width_percent) && isNaN(params.height_percent)) {
			alert("Missing at least 1 size parameter.");
			return false;
		}
		
		// Build a list of actions to execute for resize
		let actions: any[] | undefined = [];
		
		if (params.layers == "All") {
			//resize all layers
			let skips = 0;
			for (let i in config.layers) {
				try {
					actions = actions.concat(await this.resize_layer(config.layers[i] as any, params as any));
				} catch (error) {
					skips++;
				}
			}
			if (skips > 0) {
				alert(`${skips  } layer(s) were skipped.`);
			}
			actions = actions.concat(this.resize_gui(params as any));
		}
		else {
			//only active
			actions = actions.concat(await this.resize_layer(config.layer as any, params as any));
		}
		return app.State?.do_action(
			new app.Actions.Bundle_action("resize_layers", "Resize Layers", actions)
		);
	}

	/**
	 * Generates actions that will resize layer (image, text, vector), returns a promise that rejects on failure.
	 * 
	 * @param {object} layer
	 * @param {object} params
	 * @returns {Promise<object>} Returns array of actions to perform
	 */
	async resize_layer(layer: Base_layers_class, params: { mode: any; width: string; height: string; width_percent: string; height_percent: string; sharpen: any; layers: string; }) {
		let units = this.Tools_settings.get_setting("default_units") as string;
		let resolution = this.Tools_settings.get_setting("resolution") as number;
		let mode = params.mode;
		let width = parseFloat(params.width);
		let height = parseFloat(params.height);
		let width_100 = parseInt(params.width_percent);
		let height_100 = parseInt(params.height_percent);
		let canvas_width = layer.width;
		let canvas_height = layer.height;
		let sharpen = params.sharpen;
		let _this = this;

		//convert units
		if (isNaN(width) == false){
			width = this.Helper.get_internal_unit(width, units, resolution);
		}
		if (isNaN(height) == false){
			height = this.Helper.get_internal_unit(height, units, resolution);
		}

		//if dimension with percent provided
		if (isNaN(width) && isNaN(height)) {
			if (isNaN(width_100) == false) {
				width = Math.round(config.WIDTH * width_100 / 100);
				canvas_width = Math.round(config.WIDTH * width_100 / 100);
			}
			if (isNaN(height_100) == false) {
				height = Math.round(config.HEIGHT * height_100 / 100);
				canvas_height = Math.round(config.HEIGHT * height_100 / 100);
			}
		}

		//if only 1 dimension was provided
		if (isNaN(width) || isNaN(height)) {
			let ratio = layer.width / layer.height;
			let canvas_ratio = config.WIDTH / config.HEIGHT;
			if (isNaN(width))
				width = Math.round(height * ratio);
				canvas_width = Math.round(canvas_height * canvas_ratio);
			if (isNaN(height))
				height = Math.round(width / ratio);
				canvas_height = Math.round(canvas_width / canvas_ratio);
		}

		let new_x = params.layers == "All" ? Math.round(layer.x * width / config.WIDTH) : layer.x;
		let new_y = params.layers == "All" ? Math.round(layer.y * height / config.HEIGHT) : layer.y;
		let xratio = width / config.WIDTH;
		let yratio = height / config.HEIGHT;
		
		//is text
		if (layer.type == "text") {
			let data = JSON.parse(JSON.stringify(layer.data));
			for (let line of data) {
				for (let span of line) {
					span.meta.size = Math.ceil((span.meta.size || textMetaDefaults.size) * xratio);
					span.meta.stroke_size = parseFloat((0.1 * Math.round((span.meta.stroke_size != null ? span.meta.stroke_size : textMetaDefaults.stroke_size) * xratio / 0.1)).toFixed(1));
					span.meta.kerning = Math.ceil((span.meta.kerning || textMetaDefaults.kerning) * xratio);
				}
			}

			// Return actions
			return [
				new app.Actions.Update_layer_action(layer.id, {
					x: new_x, 
					y: new_y,
					data,
					width: layer.width * xratio,
					height: layer.height * yratio
				} as any)
			];
		}
		
		//is vector
		else if (layer.is_vector == true && layer.width != null && layer.height != null) {
			// Return actions
			return [
				new app.Actions.Update_layer_action(layer.id, {
					x: new_x, 
					y: new_y,
					width: layer.width * xratio,
					height: layer.height * yratio
				} as any)
			];
		}
		
		//only images supported at this point
		else if (layer.type != "image") {
			//error - no support
			alert("Layer must be vector or image (convert it to raster).");
			throw new Error("Layer is not compatible with resize");
		}
		
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(layer.id, true, false);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//validate
		if (mode == "Hermite" && (width > canvas.width || height > canvas.height)) {
			alert("Scaling up is not supported in Hermite, using Lanczos.");
			mode = "Lanczos";
		}
		
		//resize
		if (mode == "Lanczos") {
			//Pica resize with max quality
			
			let tmp_data = document.createElement("canvas");
			tmp_data.width = width;
			tmp_data.height = height;
			
			await this.pica.resize(canvas, tmp_data, {
				alpha: true,
			})
			.then((result: any) => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(tmp_data, 0, 0, width, height);
			});
		}
		else if (mode == "Hermite") {
			//Hermite resample
			this.Hermite.resample_single(canvas, width, height, true);
		}
		else {
			//simple resize
			let tmp_data = document.createElement("canvas");
			tmp_data.width = canvas.width;
			tmp_data.height = canvas.height;
			tmp_data.getContext("2d")?.drawImage(canvas, 0, 0);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			canvas.width = width;
			canvas.height = height;
			
			ctx.drawImage(tmp_data, 0, 0, width, height);
		}

		if (sharpen == true) {
			let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			let filtered = _this.ImageFilters.Sharpen(imageData, 1);	//add effect
			ctx.putImageData(filtered, 0, 0);
		}

		// Return actions
		return [
			new app.Actions.Update_layer_image_action(canvas, layer.id),
			new app.Actions.Update_layer_action(layer.id, {
				x: new_x, 
				y: new_y,
				width: canvas.width,
				height: canvas.height,
				width_original: canvas.width,
				height_original: canvas.height
			} as any)
		];
	}
	
	resize_gui(params: { width: string; height: string; width_percent: string; height_percent: string; }) {
		let units = this.Tools_settings.get_setting("default_units") as string;
		let resolution = this.Tools_settings.get_setting("resolution") as number;

		let width = parseFloat(params.width);
		let height = parseFloat(params.height);
		let width_100 = parseInt(params.width_percent);
		let height_100 = parseInt(params.height_percent);

		//convert units
		if (isNaN(width) == false){
			width = this.Helper.get_internal_unit(width, units, resolution);
		}
		if (isNaN(height) == false){
			height = this.Helper.get_internal_unit(height, units, resolution);
		}

		//if dimension with percent provided
		if (isNaN(width) && isNaN(height)) {
			if (isNaN(width_100) == false) {
				width = Math.round(config.WIDTH * width_100 / 100);
			}
			if (isNaN(height_100) == false) {
				height = Math.round(config.HEIGHT * height_100 / 100);
			}
		}

		//if only 1 dimension was provided
		if (isNaN(width) || isNaN(height)) {
			let ratio = config.WIDTH / config.HEIGHT;
			if (isNaN(width))
				width = Math.round(height * ratio);
			if (isNaN(height))
				height = Math.round(width / ratio);
		}

		return [
			new app.Actions.Prepare_canvas_action("undo"),
			new app.Actions.Update_config_action({
				WIDTH: width,
				HEIGHT: height
			}),
			new app.Actions.Prepare_canvas_action("do")
		];
	}

}

export default Image_resize_class;