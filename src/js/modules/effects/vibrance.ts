import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";

// @ts-ignore
import glfx from "../../libs/glfx";

class Effects_vibrance_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	fx_filter: any;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = null;
	}

	vibrance() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Vibrance",
			preview: true,
			effects: true,
			params: [
				{name: "level", title: "Level:", value: "0.5", range: [-1, 1], step: 0.01},
			],
			on_change: function (params: any, canvas_preview: CanvasRenderingContext2D, w: any, h: any, canvas_: HTMLCanvasElement) {
				let data = _this.change(canvas_, params);
				canvas_preview.clearRect(0, 0, canvas_.width, canvas_.height);
				canvas_preview.drawImage(data, 0, 0);
			},
			on_finish: function (params: any) {
				_this.save(params);
			},
		};
		this.POP.show(settings as any);
	}

	save(params: any) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let data = this.change(canvas, params);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas: HTMLCanvasElement, params: { level: any; }) {
		if (this.fx_filter == null) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		let param1 = parseFloat(params.level);

		let texture = this.fx_filter?.texture(canvas);
		this.fx_filter?.draw(texture).vibrance(param1).update();	//effect

		return this.fx_filter;
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//modify
		let params = {
			level: 0.5,
		};
		let data = this.change(canvas_thumb, params) as HTMLCanvasElement;

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_vibrance_class;