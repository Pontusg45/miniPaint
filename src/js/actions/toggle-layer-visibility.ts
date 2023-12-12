import app from "../app";
import config from "../config";
import { Base_action } from "./base";

export class Toggle_layer_visibility_action extends Base_action {
	layer_id: number;
	old_visible = false;
	/**
	 * toggle layer visibility
	 *
	 * @param {int} layer_id
	 */
	constructor(layer_id?: number) {
		super("toggle_layer_visibility", "Toggle Layer Visibility");
		this.layer_id = layer_id ?? 0;
	}

	async do() {
		super.do();
		const layer = app.Layers?.get_layer(this.layer_id);
		this.old_visible = layer?.visible || false;
		if (!layer) return;
		if (layer.visible)
			layer.visible = true;
		else
			layer.visible = false;
		app.Layers?.render();
		app.GUI?.GUI_layers?.render_layers();
	}

	async undo() {
		super.undo();
		const layer = app.Layers?.get_layer(this.layer_id);
		if (!layer) return;
		layer.visible = this.old_visible;
		this.old_visible = false;
		app.Layers?.render();
		app.GUI?.GUI_layers?.render_layers();
	}
}