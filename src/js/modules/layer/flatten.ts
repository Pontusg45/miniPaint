// @ts-nocheck
import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";

class Layer_flatten_class {
	Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	flatten() {
		//create tmp canvas
		let canvas = document.createElement("canvas");
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		
		let layers_sorted = this.Base_layers.get_sorted_layers();

		//paint layers
		for (let i = layers_sorted.length - 1; i >= 0; i--) {
			let layer = layers_sorted[i];
			
			ctx.globalAlpha = layer.opacity / 100;
			ctx.globalCompositeOperation = layer.composition;

			this.Base_layers.render_object(ctx, layer);
		}

		//create requested layer
		let params = [];
		params.type = "image";
		params.name = "Merged";
		params.data = canvas.toDataURL("image/png");

		//remove rest of layers
		let delete_actions = [];
		for (let i = config.layers.length - 1; i >= 0; i--) {
			delete_actions.push(new app.Actions.Delete_layer_action(config.layers[i].id));
		}
		// Run actions
		app.State?.do_action(
			new app.Actions.Bundle_action("flatten_image", "Flatten Image", [
				new app.Actions.Insert_layer_action(params),
				...delete_actions
			])
		);

		canvas.width = 1;
		canvas.height = 1;
	}

}

export default Layer_flatten_class;