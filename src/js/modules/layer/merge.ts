import { Layer } from "../../../../types/types";
import app from "../../app";
import config from "../../config";

import Base_layers_class from "../../core/base-layers";

class Layer_merge_class {
	Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	merge() {
		if (this.Base_layers.find_previous(config.layer.id) == null) {
			alert("There are no layers behind.");
			return false;
		}

		//create tmp canvas
		let canvas = document.createElement("canvas");
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//first layer
		let previous_layer = this.Base_layers.find_previous(config.layer.id) as Layer;
		let previous_id = previous_layer.id;
		ctx.globalAlpha = previous_layer.opacity / 100;
		ctx.globalCompositeOperation = previous_layer.composition as GlobalCompositeOperation;
		this.Base_layers.render_object(ctx, previous_layer);

		//second layer
		let current_id = config.layer.id;
		let current_order = config.layer.order;
		ctx.globalAlpha = config.layer.opacity / 100;
		ctx.globalCompositeOperation = config.layer.composition as GlobalCompositeOperation;
		this.Base_layers.render_object(ctx, config.layer);

		//create requested layer
		let params = {
			order: current_order,
			name: `${config.layer.name  } + merged`,
			type: "image",
			data: canvas.toDataURL("image/png"),
		};
		app.State?.do_action(
			new app.Actions.Bundle_action("merge_layers", "Merge Layers", [
				new app.Actions.Insert_layer_action(params as any),
				new app.Actions.Delete_layer_action(current_id),
				new app.Actions.Delete_layer_action(previous_id)
			])
		);

		//free canvas data
		canvas.width = 1;
		canvas.height = 1;
	}

}

export default Layer_merge_class;