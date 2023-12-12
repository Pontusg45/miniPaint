import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";

class Layer_clear_class {
  private Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	clear() {
		return app.State?.do_action(
			new app.Actions.Clear_layer_action(config.layer?.id ?? 0)
		);
	}

}

export default Layer_clear_class;