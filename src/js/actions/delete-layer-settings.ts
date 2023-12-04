import { Layer, Settings } from "../../../types/types.js";
import app from "../app.js";
import config from "../config.js";
import Base_layers_class from "../core/base-layers.js";
import { Base_action } from "./base.js";

export class Delete_layer_settings_action extends Base_action {
	layer_id: number;
	setting_names: Layer | undefined;
	reference_layer: null | undefined | Layer;
	old_settings = {} as Layer | undefined;
	/**
	 * Deletes the specified settings in a layer
	 *
	 * @param {int} layer_id
	 * @param {array} setting_names 
	 */
	constructor(layer_id: number, setting_names?: Layer) {
		super("delete_layer_settings", "Delete Layer Settings");
		this.layer_id = layer_id;
		this.setting_names = setting_names;
		this.reference_layer = null;
		this.old_settings = {} as Layer;
	}

	do() {
		super.do();
		this.reference_layer = app.Layers?.get_layer(this.layer_id) as Layer;
		if (!this.reference_layer || !this.setting_names || !this.old_settings) {
			throw new Error("Aborted - layer with specified id doesn't exist");
		}
		for (let i = 0; i < this.setting_names?.length; i++) {
			this.old_settings[i] = this.reference_layer[i];
			delete this.reference_layer[i];
		}
		config.need_render = true;
	}

	async undo() {
		super.undo();
		if (this.reference_layer) {
			for (let i in this.old_settings) {
				this.reference_layer[i as keyof Layer] = this.old_settings[i  as keyof Layer];
			}
			this.old_settings = {} as Layer;
		}
		this.reference_layer = null;
		config.need_render = true;
	}

	free() {
		this.setting_names = undefined;
		this.reference_layer = null;
		this.old_settings = undefined;
	}
}