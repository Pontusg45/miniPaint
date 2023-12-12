import { Update_layer_action } from ".";
import { Layer } from "../../../types/types";
import app from "../app";
import config from "../config";
import Base_layers_class from "../core/base-layers";
import { Base_action } from "./base";
import {Delete_layer_settings_action} from "./delete-layer-settings";

export class Clear_layer_action extends Base_action {
  private layer_id: number;
  private update_layer_action: null | Update_layer_action;
  private delete_layer_settings_action: null | Delete_layer_settings_action;
	/**
	 * clear layer data
	 *
	 * @param {int} layer_id
	 */
	constructor(layer_id: number) {
		super("clear_layer", "Clear Layer");
		this.layer_id = parseInt(String(layer_id));
		this.update_layer_action = null;
		this.delete_layer_settings_action = null;
	}

	async do() {
		super.do();
		const layer = app.Layers?.get_layer(this.layer_id);
		if (!layer) {
			throw new Error("Aborted - layer with specified id doesn't exist");
		}
		
		const new_settings = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visible: true,
			opacity: 100,
			composition: null,
			rotate: 0,
			data: null,
			params: {},
			status: null,
			render_function: null,
			type: null,
			link: undefined
		} as unknown as Layer;
		if (layer.type == "image") {
			//clean image
			new_settings.link = undefined;
		}
		this.update_layer_action = new app.Actions.Update_layer_action(this.layer_id ?? 0, new_settings);
		await this.update_layer_action.do();
		const delete_setting_names = [];
		for (const prop_name in layer) {
			//remove private attributes
			if (prop_name[0] == "_") {
				delete_setting_names.push(prop_name);
			}
		}
		if (delete_setting_names.length > 0) {
			this.delete_layer_settings_action = new app.Actions.Delete_layer_settings_action(this.layer_id, delete_setting_names as any);
			await this.delete_layer_settings_action.do();
		}
	}

	async undo() {
		super.undo();
		if (this.delete_layer_settings_action) {
			await this.delete_layer_settings_action.undo();
			this.delete_layer_settings_action.free();
			this.delete_layer_settings_action = null;
		}
		if (this.update_layer_action) {
			await this.update_layer_action.undo();
			this.update_layer_action.free();
			this.update_layer_action = null;
		}
	}

	free() {
		if (this.update_layer_action) {
			this.update_layer_action.free();
			this.update_layer_action = null;
		}
		if (this.delete_layer_settings_action) {
			this.delete_layer_settings_action.free();
			this.delete_layer_settings_action = null;
		}
	}
}