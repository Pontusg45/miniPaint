import app from "../../../app.js";
import config from "../../../config.js";
import Dialog_class from "../../../libs/popup.js";
import Base_layers_class from "../../../core/base-layers.js";

class Effects_xpro2_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	xpro2() {
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		let ctx = canvas.getContext("2d");

		//change data
		let data = this.change(canvas, canvas.width, canvas.height);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas, width, height) {

		//create temp canvas
		let canvas2 = document.createElement("canvas");
		let ctx2 = canvas2.getContext("2d");
		canvas2.width = width;
		canvas2.height = height;
		ctx2.drawImage(canvas, 0, 0);

		//merge
		ctx2.globalCompositeOperation = "color-burn";
		let min = Math.min(width, height);
		let gradient = ctx2.createRadialGradient(width / 2, height / 2, min * 0.4, width / 2, height / 2, min * 1.1);
		gradient.addColorStop(0, "#e6e7e0");
		gradient.addColorStop(1, "rgba(43, 42, 161, 0.6)");
		ctx2.fillStyle = gradient;
		ctx2.fillRect(0, 0, width, height);
		ctx2.globalCompositeOperation = "source-over";

		//apply more effects
		ctx2.filter = "sepia(0.3)";
		ctx2.drawImage(canvas2, 0, 0);
		ctx2.filter = "none";

		return canvas2;
	}

	demo(canvas_id, canvas_thumb){
		let canvas = document.getElementById(canvas_id);
		let ctx = canvas.getContext("2d");

		//modify
		let data = this.change(canvas_thumb, canvas_thumb.width, canvas_thumb.height);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_xpro2_class;