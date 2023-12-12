import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";

// @ts-ignore
import glfx from "../../libs/glfx";
import ImageFilters_class from "../../libs/imagefilters";
import { ImageFiltersType } from "../../../../types/types";

class Effects_nightVision_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	fx_filter: any;
	ImageFilters: ImageFiltersType;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
		this.ImageFilters = ImageFilters_class;
	}

	night_vision() {
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
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}
		
		//create second copy
		let canvas2 = document.createElement("canvas");
		let ctx2 = canvas2.getContext("2d") as CanvasRenderingContext2D;
		canvas2.width = width;
		canvas2.height = height;
		ctx2.drawImage(canvas, 0, 0);
		
		// green overlay
		let img = ctx2.getImageData(0, 0, width, height);
		//RGB corrections
		img = this.ImageFilters.ColorTransformFilter(img, 1, 1, 1, 1, 0, 100, 0, 1);
		//hue/saturation/luminance
		img = this.ImageFilters.HSLAdjustment(img, 0, 0, -50);
		ctx2.putImageData(img, 0, 0);
		
		//vignete
		let texture = this.fx_filter.texture(canvas2);
		this.fx_filter.draw(texture).vignette(0.2, 0.9).update();	//effect
		canvas2 = this.fx_filter;
		
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

export default Effects_nightVision_class;