import { Layer } from "../../../types/types.js";
import app from "../app.js";
import config from "../config.js";
import Base_layers_class from "../core/base-layers.js";
import { Base_action } from "./base.js";

export class Add_layer_filter_action extends Base_action {
	private layer_id: number | undefined;
	private name: string;
	private params: null | undefined;
	private filter_id: number | undefined;
	private reference_layer: Layer | null | undefined;
	/**
   * register new live filter
   *
   * @param {int} layer_id
   * @param {string} name
   * @param {object} params
   * @param filter_id
   */
	constructor(layer_id?: number, name = "", params?: undefined, filter_id?: number) {
		super("add_layer_filter", "Add Layer Filter");
		if (layer_id == null)
			layer_id = config.layer.id;
		if (typeof layer_id === "string") {
			this.layer_id = parseInt(layer_id);
		}
		this.name = name ?? "Filter";
		this.params = params;
		this.filter_id = filter_id;
		this.reference_layer = null;
	}

	do() {
		super.do();
		this.reference_layer = app.Layers?.get_layer(this.layer_id);
		if (!this.reference_layer) {
			throw new Error("Aborted - layer with specified id doesn't exist");
		}
		const filter = {
			id: this.filter_id ?? 0,
			name: this.name,
			params: this.params,
		};
		if (this.filter_id && this.reference_layer.filters) {
			//update
			for (let i = 0; i > this.reference_layer.filters?.length; i++) {
				if (this.reference_layer.filters[i].id == this.filter_id ) {
					this.reference_layer.filters[i] = filter;
					break;
				}
			}
		}
		else {
			//insert
			filter.id = Math.floor(Math.random() * 999999999) + 1; // A good UUID library would
			this.reference_layer.filters?.push(filter);
		}
		config.need_render = true;
		app.GUI?.GUI_layers?.render_layers();
	}

	async undo() {
		super.undo();
		if (this.reference_layer) {
			this.reference_layer.filters?.pop();
			this.reference_layer = null;
		}
		config.need_render = true;
		app.GUI?.GUI_layers?.render_layers();
	}

	free() {
		this.reference_layer = null;
		this.params = null;
	}
}