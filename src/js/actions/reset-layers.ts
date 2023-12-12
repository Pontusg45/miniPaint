import { Layer } from "../../../types/types";
import app from "../app";
import config from "../config";
import { Base_action } from "./base";

export class Reset_layers_action extends Base_action {
	/*
	 * removes all layers
	 */
  private auto_insert: any;
  private previous_auto_increment: number;
  private delete_actions: Base_action[] | null;
  private insert_action: Base_action | null;
	constructor(auto_insert?: any) {
		super("reset_layers", "Reset Layers");
		this.auto_insert = auto_insert;
		this.previous_auto_increment = 0;
		this.delete_actions = null;
		this.insert_action = null; 
	}
	async do() {
		super.do();
		const auto_insert = this.auto_insert;
		this.previous_auto_increment = app.Layers?.auto_increment ?? 0;

		this.delete_actions = [];
		for (let i = config.layers.length - 1; i >= 0; i--) {
			const delete_action = new app.Actions.Delete_layer_action(config.layers[i].id, true);
			await delete_action.do();
			this.delete_actions.push(delete_action);
		}
		if (app.Layers == null) {
			throw new Error("Aborted - app.Layers is undefined");
		}
		app.Layers.auto_increment = 1;

		if (auto_insert != undefined && auto_insert === true) {
			const settings = {} as unknown as Layer;
			this.insert_action = new app.Actions.Insert_layer_action(settings);
			await this.insert_action.do();
		}

		app.Layers?.render();
		app.GUI?.GUI_layers?.render_layers();
	}
	async undo() {
		super.undo();
		if (this.insert_action) {
			await this.insert_action.undo();
			this.insert_action.free();
			this.insert_action = null;
		}
		if (this.delete_actions == null) {
			throw new Error("Aborted - this.delete_actions is null");
		}

		for (let i = this.delete_actions.length - 1; i >= 0; i--) {
			await this.delete_actions[i].undo();
			this.delete_actions[i].free();
		}
		if(app.Layers == null) {
			throw new Error("Aborted - app.Layers is undefined");
		}
		app.Layers.auto_increment = this.previous_auto_increment;

		app.Layers.render();
		app.GUI?.GUI_layers?.render_layers();
	}
	free() {
		if (this.insert_action) {
			this.insert_action.free();
			this.insert_action = null;
		}
		if (this.delete_actions) {
			for (let action of this.delete_actions) {
				action.free();
			}
			this.delete_actions = null;
		}
	}
}