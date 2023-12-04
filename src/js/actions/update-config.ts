import { Layer } from "../../../types/types.js";
import app from "../app.js";
import config from "../config.js";
import { Base_action } from "./base.js";

export class Update_config_action extends Base_action {
	settings: any;
	old_settings = {} as Layer;
	/**
	 * Updates the app config with the provided settings
	 *
	 * @param {object} settings 
	 */
	constructor(settings: any) {
		super("update_config", "Update Config");
		this.settings = settings;
		this.old_settings = {} as Layer;
	}

	async do() {
		super.do();
		for (let i in this.settings) {
			this.old_settings[i as keyof Layer] = config[i  as keyof Layer];
			config[i] = this.settings[i];
		}
	}

	async undo() {
		super.undo();
		for (let i in this.old_settings) {
			config[i as keyof Layer] = this.old_settings[i];
		}
		this.old_settings = {color: "", composition: "", filters: [], height: 0, height_original: 0, hide_selection_if_active: false, id: 0, is_vector: false, name: "", opacity: 0, order: 0, params: undefined, parent_id: 0, render_function: undefined, rotate: 0, status: undefined, type: "", visible: false, width: 0, width_original: 0, x: 0, y: 0};
	}

	free() {
		this.settings = null;
		this.old_settings = null;
	}
}