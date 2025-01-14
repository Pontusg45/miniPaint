import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";

class Image_flip_class {
	Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	vertical() {
		this.flip("vertical");
	}

	horizontal() {
		this.flip("horizontal");
	}

	flip(mode: string) {
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//create destination canvas
		let canvas2 = document.createElement("canvas");
		canvas2.width = canvas.width;
		canvas2.height = canvas.height;
		let ctx2 = canvas2.getContext("2d") as CanvasRenderingContext2D;
		canvas2.dataset.x = canvas.dataset.x;
		canvas2.dataset.y = canvas.dataset.y;

		//flip
		if (mode == "vertical") {
			ctx2.scale(1, -1);
			ctx2.drawImage(canvas, 0, canvas2.height * -1);
		}
		else if (mode == "horizontal") {
			ctx2.scale(-1, 1);
			ctx2.drawImage(canvas, canvas2.width * -1, 0);
		}

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas2)
		);
	}

}

export default Image_flip_class;