import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";

class Layer_visibility_class {
	Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	toggle() {
		app.State?.do_action(
			new app.Actions.Toggle_layer_visibility_action(config.layer.id)
		);
	}

}

export default Layer_visibility_class;