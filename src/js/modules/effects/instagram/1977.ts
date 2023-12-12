import app from "../../../app";
import config from "../../../config";
import Dialog_class from "../../../libs/popup";
import Base_layers_class from "../../../core/base-layers";

class Effects_1977_class {
  private POP: Dialog_class;
  private Base_layers: Base_layers_class;

	constructor() {
		this.POP = new Dialog_class();
		//this.Color_matrix = new Color_matrix_class();
		this.Base_layers = new Base_layers_class();
	}

	1977() {
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		//get canvas from layer
    const canvas = this.Base_layers.convert_layer_to_canvas(0, true) ;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    //change data
    const data = this.change(canvas, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas: CanvasImageSource, width: number, height: number) {

		//create temp canvas
		let canvas2 = document.createElement("canvas");
		let ctx2 = canvas2.getContext("2d") as CanvasRenderingContext2D;
		canvas2.width = width;
		canvas2.height = height;
		ctx2.drawImage(canvas, 0, 0);

		//merge
		ctx2.globalCompositeOperation = "screen";
		ctx2.fillStyle = "rgba(243, 106, 188, 0.3)";
		ctx2.fillRect(0, 0, width, height);
		ctx2.globalCompositeOperation = "source-over";

		//apply more effects
		ctx2.filter = "contrast(1.1) brightness(1.1) saturate(1.3)";
		ctx2.drawImage(canvas2, 0, 0);
		ctx2.filter = "none";

		return canvas2;
	}

	demo(canvas_id: string, canvas_thumb: HTMLCanvasElement){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//modify
		let data = this.change(canvas_thumb, canvas_thumb.width, canvas_thumb.height);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_1977_class;