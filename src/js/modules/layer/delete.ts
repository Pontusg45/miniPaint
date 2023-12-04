import app from "../../app.js";
import config from "../../config.js";
import Base_layers_class from "../../core/base-layers.js";

class Layer_delete_class {
  private Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	delete() {
		void app.State?.do_action(
			new app.Actions.Delete_layer_action(config.layer?.id ?? 0)
		);
	}

}

export default Layer_delete_class;