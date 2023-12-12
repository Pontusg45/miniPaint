// @ts-nocheck
import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";

class Layer_raster_class {
	Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	raster() {
		let canvas = this.Base_layers.convert_layer_to_canvas();
		let current_layer = config.layer;
		let current_id = current_layer.id;

		//show
		let params = {
			type: "image",
			name: `${config.layer.name  } + raster`,
			data: canvas.toDataURL("image/png"),
			x: parseInt(canvas.dataset.x),
			y: parseInt(canvas.dataset.y),
			width: canvas.width,
			height: canvas.height,
			opacity: current_layer.opacity,
		};
		app.State?.do_action(
			new app.Actions.Bundle_action("convert_to_raster", "Convert to Raster", [
				new app.Actions.Insert_layer_action(params, false),
				new app.Actions.Delete_layer_action(current_id)
			])
		);
	}

}

export default Layer_raster_class;
