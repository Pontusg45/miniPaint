import app from "../app";
import { Base_action } from "./base";
import Base_layers_class from "../core/base-layers";
import { Layer } from "../../../types/types";

export class Reorder_layer_action extends Base_action {
  private readonly layer_id: number;
  private readonly direction: number;
  private reference_layer: Layer | null | undefined;
  private reference_target: Layer | null | undefined;
  private old_layer_order = 0;
  private old_target_order = 0;
	/**
	 * Reorder layer up or down in the layer stack
	 *
	 * @param {int} layer_id
	 * @param {int} direction
	 */
	constructor(layer_id: number, direction: number) {
		super("reorder_layer", "Reorder Layer");
		this.layer_id = layer_id;
		this.direction = direction;
		this.reference_layer = null;
		this.reference_target = null;
	}

  do() {
		super.do();
		this.reference_layer = app.Layers?.get_layer(this.layer_id);
		if (!this.reference_layer) {
			throw new Error("Aborted - layer with specified id doesn't exist");
		}
		if (this.direction < 0) {
			this.reference_target = app.Layers?.find_previous(this.layer_id);
		}
		else {
			this.reference_target = app.Layers?.find_next(this.layer_id);
		}
		if (!this.reference_target) {
			throw new Error("Aborted - layer has nowhere to move");
		}
		this.old_layer_order = this.reference_layer.order;
		this.old_target_order = this.reference_target.order;
		this.reference_layer.order = this.old_target_order;
		this.reference_target.order = this.old_layer_order;

		app.Layers?.render();
		app.GUI?.GUI_layers?.render_layers();
	}

	undo() {
		super.undo();
		if (this.reference_layer) {
			this.reference_layer.order = this.old_layer_order;
			this.reference_layer = null;
		}
		if (this.reference_target) {
			this.reference_target.order = this.old_target_order;
			this.reference_target = null;
		}
		app.Layers?.render();
		app.GUI?.GUI_layers?.render_layers();
	}

	free() {
		this.reference_layer = null;
		this.reference_target = null;
	}
}