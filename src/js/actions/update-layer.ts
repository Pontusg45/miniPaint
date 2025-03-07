import app from "../app";
import config from "../config";
import { Base_action } from "./base";
import Base_layers_class from "../core/base-layers";
import { Layer } from "../../../types/types";

export class Update_layer_action extends Base_action {
  private layer_id: number;
  private settings: Layer;
  private reference_layer: Layer | null;
  private old_settings: {};
	/**
	 * Updates an existing layer with the provided settings
	 * WARNING: If passing objects or arrays into settings, make sure these are new or cloned objects, and not a modified existing object!
	 *
	 * @param {string} layer_id
	 * @param {object} settings 
	 */
	constructor(layer_id: number, settings: Layer) {
		super("update_layer", "Update Layer");
		this.layer_id = layer_id;
		this.settings = settings;
		this.reference_layer = null;
		this.old_settings = {};
	}

  do() {
		super.do();
		this.reference_layer = app.Layers?.get_layer(this.layer_id) as Layer;
		if (!this.reference_layer) {
			throw new Error("Aborted - layer with specified id doesn't exist");
		}
		for (const i in this.settings) {
			if (i == "id")
				continue;
			if (i == "order")
				continue;
			// @ts-ignore
			this.old_settings[i] = this.reference_layer[i];
			// @ts-ignore
			this.reference_layer[i] = this.settings[i];
		}
		if (this.reference_layer.type === "text") {
			// @ts-ignore
			this.reference_layer._needs_update_data = true;
		}
		if (this.settings.params || this.settings.width || this.settings.height) {
			config.need_render_changed_params = true;
		}
		config.need_render = true;
	}

	async undo() {
		super.undo();
		if (this.reference_layer) {
			for (let i in this.old_settings) {
				// @ts-ignore
				this.reference_layer[i] = this.old_settings[i];
			}
			if (this.reference_layer.type === "text") {
				// @ts-ignore
				this.reference_layer._needs_update_data = true;
			}
			// @ts-ignore
			if (this.old_settings.params || this.old_settings.width || this.old_settings.height) {
				config.need_render_changed_params = true;
			}
			this.old_settings = {};
		}
		this.reference_layer = null;
		config.need_render = true;
	}

	free() {
		// @ts-ignore
		this.settings = null;
		// @ts-ignore
		this.old_settings = null;
		this.reference_layer = null;
	}
}