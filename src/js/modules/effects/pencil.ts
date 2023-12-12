import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";

class Effects_pencil_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	pencil() {
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let data = this.change(canvas, canvas.width, canvas.height);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas: CanvasImageSource, width: number, height: number) {
		let offset = Math.min(width, height) / 1000;
		offset = Math.ceil(offset);
		
		//create second copy
		let canvas2 = document.createElement("canvas");
		let ctx2 = canvas2.getContext("2d") as CanvasRenderingContext2D;
		canvas2.width = width;
		canvas2.height = height;
		ctx2.drawImage(canvas, -offset, -offset);
		
		//merge
		ctx2.globalCompositeOperation = "difference";
		ctx2.drawImage(canvas, 0, 0);
		ctx2.globalCompositeOperation = "source-over";
		
		//apply more effects
		ctx2.filter = "brightness(2) invert(1) grayscale(1)";
		ctx2.drawImage(canvas2, 0, 0);
		ctx2.filter = "none";
		
		return canvas2;
	}

	demo(canvas_id: string, canvas_thumb: HTMLCanvasElement){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//modify
		let params = {};
		let data = this.change(canvas_thumb, canvas_thumb.width, canvas_thumb.height);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_pencil_class;