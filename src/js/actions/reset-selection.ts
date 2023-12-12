import { Layer } from "../../../types/types";
import app from "../app";
import config from "../config";
import { Base_action } from "./base";

type Old_settings_data = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export class Reset_selection_action extends Base_action {
	mirror_selection_settings: Layer | undefined;
	settings_reference: null | Layer;
	old_settings_data: null | Old_settings_data;
	/**
	 * Sets the selection to empty
	 * 
	 * @prop {object} [mirror_selection_settings] - Optional object to also set to an empty selection object 
	 */
	constructor(mirror_selection_settings?: Layer) {
		super("reset_selection", "Reset Selection");
		this.mirror_selection_settings = mirror_selection_settings;
		this.settings_reference = null;
		this.old_settings_data = null;
	}

	async do() {
		super.do();
		this.settings_reference = app.Layers?.Base_selection?.find_settings() as unknown as Layer;
		this.old_settings_data = JSON.parse(JSON.stringify(this.settings_reference.data));
		this.settings_reference.data = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		} as any;
		if (this.mirror_selection_settings) {
			this.mirror_selection_settings.x = 0;
			this.mirror_selection_settings.y = 0;
			this.mirror_selection_settings.width = 0;
			this.mirror_selection_settings.height = 0;
		}
		config.need_render = true;
	}

	async undo() {
		super.undo();
		if (this.old_settings_data && this.settings_reference?.data) {
			for (let prop of ["x", "y", "width", "height"]) {
				// @ts-ignore
				this.settings_reference.data[prop] = this.old_settings_data[prop  as keyof Old_settings_data];
				if (this.mirror_selection_settings) {
					this.mirror_selection_settings[prop as keyof Old_settings_data] = this.old_settings_data[prop  as keyof Old_settings_data];
				}
			}
		}
		this.settings_reference = null;
		this.old_settings_data = null;
		config.need_render = true;
	}

	free() {
		this.settings_reference = null;
		this.old_settings_data = null;
		this.mirror_selection_settings = undefined;
	}
}

let employe: Employe = {
	name: "John",
	age: 30,
	retir: () => {
		console.log("Goodbye!");
	}
};

type Employe = {
	name: string;
	age: number;
	retir : () => void;
}

employe.retir();
