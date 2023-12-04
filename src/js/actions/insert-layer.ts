import app from "../app.js";
import config from "../config.js";
import { Base_action } from "./base.js";
import Layer_clear_class from "../modules/layer/clear";
import Base_layers_class from "../core/base-layers.js";
import { Delete_layer_action } from "./delete-layer.js";
import { Update_layer_action } from "./update-layer.js";
import { Layer } from "../../../types/types.js";

export class Insert_layer_action extends Base_action {
	private previous_auto_increment: number | undefined;
	private previous_selected_layer: Layer | undefined;
	private settings: Layer | undefined;
	private update_layer_action: Update_layer_action | undefined;
	private inserted_layer_id: number | undefined;
	private delete_layer_action: Delete_layer_action | undefined;
	private autoresize_canvas_action: Base_action | null | undefined;
	private can_automate: boolean | undefined;
	/**
	 * Creates new layer
	 *
	 * @param {object} settings
	 * @param {boolean} can_automate
	 */
	constructor(settings?: Layer, can_automate?: boolean) {
		super("insert_layer", "Insert Layer");
		this.settings = settings;
		this.can_automate = can_automate;
		this.inserted_layer_id = undefined;
		this.update_layer_action = undefined;
		this.autoresize_canvas_action = null;
	}

	async do() {
		super.do();

		this.previous_auto_increment = app.Layers?.auto_increment;
		this.previous_selected_layer = config.layer;
		let autoresize_as = null;

		// Default data
		const layer = {
			id: app.Layers?.auto_increment ?? 0,
			parent_id: 0,
			name: `${config.TOOL.name.charAt(0).toUpperCase() + config.TOOL.name.slice(1)} #${app.Layers?.auto_increment}`,
			type: null,
			link: new Image(),
			x: 0,
			y: 0,
			width: 0,
			width_original: 0,
			height: 0,
			height_original: 0,
			visible: true,
			is_vector: false,
			hide_selection_if_active: false,
			opacity: 100,
			order: app.Layers?.auto_increment,
			composition: "source-over",
			rotate: 0,
			data: {
				height: 0,
				width: 0,
			},
			params: {},
			status: null,
			color: config.COLOR,
			filters: [],
			render_function: null,
		} as unknown as Layer;

		// Build data
		for (let i in this.settings) {
			if (typeof layer[i as keyof Layer] == "undefined" && !i.startsWith("_")) {
				alert(`Error: wrong key: ${i}`);
				continue;
			}
			layer[i as keyof Layer] = this.settings[i as keyof Layer];
		}

		// Prepare image
		let image_load_promise;
		if (layer.type == "image") {

			if (layer.name.toLowerCase().indexOf(".svg") == layer.name.length - 4) {
				// We have svg
				layer.is_vector = true;
			}

			if (config.layers.length == 1 && (config.layer.width == 0 || config.layer.width === null)
				&& (config.layer.height == 0 || config.layer.height === null) && config.layer.data == null) {
				// Remove first empty layer

				this.delete_layer_action = new app.Actions.Delete_layer_action(config.layer.id ?? 0, true);
				await this.delete_layer_action.do();
			}

			if (layer.link == null) {
				if (layer.data !== null && typeof layer.data == "object" && layer.link) {
					// Load actual image
					if (layer.width == 0 || layer.width === null)
						layer.width = layer.data?.width;
					if (layer.height == 0 || layer.height === null)
						layer.height = layer.data.height;
					if (layer.data.cloneNode)
						layer.link = layer.data.cloneNode(true);
					if (layer.link ==  undefined) {
						layer.link.onload = function () {
							config.need_render = true;
						};
					}
					
					layer.data = null;
					autoresize_as = [layer.width, layer.height, null, true, true];
					//need_autoresize = true;
				}
				else if (typeof layer.data == "string") {
					image_load_promise = new Promise<void>((resolve, reject) => {
						// Try loading as imageData
						layer.link = new Image();
						layer.link.onload = () => {
							// Update dimensions
							if (layer.width == 0 || layer.width === null)
								layer.width = layer.link.width;
							if (layer.height == 0 || layer.height === null)
								layer.height = layer.link.height;
							if (layer.width_original == null)
								layer.width_original = layer.width;
							if (layer.height_original == null)
								layer.height_original = layer.height;
							// Free data
							layer.data = null;
							autoresize_as = [layer.width, layer.height, layer.id, this.can_automate, true];
							config.need_render = true;
							resolve();
						};
						layer.link.onerror = (error: unknown) => {
							resolve();
							alert("Sorry, image could not be loaded.");
						};
						layer.link.src = layer.data as unknown as string;
						layer.link.crossOrigin = "Anonymous";
					});
				}
				else {
					alert("Error: can not load image.");
				}
			}
		}

		if(app.Layers == null) {
			throw new Error("Aborted - app.Layers is undefined");
		}

		if (this.settings != undefined && config.layers.length > 0
			&& (config.layer.width == 0 || config.layer.width === null) && (config.layer.height == 0 || config.layer.height === null)
			&& config.layer.data == null && layer.type != "image" && this.can_automate !== false) {
			// Update existing layer, because it's empty
			this.update_layer_action = new app.Actions.Update_layer_action(config.layer.id, layer);
			await this.update_layer_action.do();
		}
		else {
			// Create new layer
			
			config.layers.push(layer);
			config.layer = app.Layers?.get_layer(layer.id);
			app.Layers.auto_increment++;

			if (config.layer == null) {
				config.layer = config.layers[0];
			}

			this.inserted_layer_id = layer.id;
		}

		if (layer.id >= app.Layers?.auto_increment)
			app.Layers.auto_increment = layer.id + 1;

		if (image_load_promise) {
			await image_load_promise;
		}

		if (autoresize_as) {
			this.autoresize_canvas_action = new app.Actions.Autoresize_canvas_action(...autoresize_as);
			try {
				await this.autoresize_canvas_action.do();
			} catch (error) {
				this.autoresize_canvas_action = null;
			}
		}

		app.Layers?.render();
		app.GUI?.GUI_layers?.render_layers();
	}

	async undo() {
		super.undo();
		if (app.Layers == null) {
			throw new Error("Aborted - app.Layers is undefined");
		}
		app.Layers.auto_increment = this.previous_auto_increment ?? 1;
		if (this.autoresize_canvas_action) {
			await this.autoresize_canvas_action.undo();
			this.autoresize_canvas_action = null;
		}
		if (this.inserted_layer_id) {
			config.layers.pop();
			this.inserted_layer_id = undefined;
		}
		if (this.update_layer_action) {
			await this.update_layer_action.undo();
			this.update_layer_action.free();
			this.update_layer_action = undefined;
		}
		if (this.delete_layer_action) {
			await this.delete_layer_action.undo();
			this.delete_layer_action.free();
			this.delete_layer_action = undefined;
		}
		if(config.layer !== undefined && this.previous_selected_layer !== undefined) {
			config.layer = this.previous_selected_layer;
		}
		this.previous_selected_layer = undefined;

		app.Layers?.render();
		app.GUI?.GUI_layers?.render_layers();
	}

	free() {
		if (this.delete_layer_action) {
			this.delete_layer_action.free();
			this.delete_layer_action = undefined;
		}
		if (this.update_layer_action) {
			this.update_layer_action.free();
			this.update_layer_action = undefined;
		}
		this.previous_selected_layer = undefined;
	}
}