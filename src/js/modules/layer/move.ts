import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";

class Layer_move_class {
	Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	async up() {
		await app.State?.do_action(
			new app.Actions.Reorder_layer_action(config.layer.id, 1)
		);
	}

	down() {
		app.State?.do_action(
			new app.Actions.Reorder_layer_action(config.layer.id, -1)
		);
	}
}

export default Layer_move_class;
