import app from "../app";
import config from "../config";
import { Base_action } from "./base";

export class Set_selection_action extends Base_action {

	x: number;
	y: number;
	width: number;
	height: number;
	settings_reference: any;
	old_settings_data: any;
	old_settings_override: any;


	/**
	 * Sets the selection to the specified position and dimensions
	 */
	constructor(x: number, y: number, width: number, height: number, old_settings_override = false) {
		super("set_selection", "Set Selection");
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.settings_reference = null;
		this.old_settings_data = null;
		this.old_settings_override = old_settings_override ? JSON.parse(JSON.stringify(old_settings_override)) || null : null;
	}

	async do() {
		super.do();
		this.settings_reference = app.Layers?.Base_selection?.find_settings();
		this.old_settings_data = JSON.parse(JSON.stringify(this.settings_reference.data));
		if (this.x != null)
			this.settings_reference.data.x = this.x;
		if (this.y != null)
			this.settings_reference.data.y = this.y;
		if (this.width != null)
			this.settings_reference.data.width = this.width;
		if (this.height != null)
			this.settings_reference.data.height = this.height;

		config.need_render = true;
	}

	async undo() {
		super.undo();
		if (this.old_settings_override) {
			for (let prop in this.old_settings_override) {
				this.settings_reference.data[prop] = this.old_settings_override[prop];   
			}
		} else {
			for (let prop in this.old_settings_data) {
				this.settings_reference.data[prop] = this.old_settings_data[prop];   
			}
		}
		this.settings_reference = null;
		this.old_settings_data = null;
		config.need_render = true;
	}

	free() {
		this.settings_reference = null;
		this.old_settings_override = null;
		this.old_settings_data = null;
	}
}