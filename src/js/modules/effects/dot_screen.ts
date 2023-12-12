// @ts-nocheck
import app from "../../app";
import config from "../../config";
import Dialog_class from "../../libs/popup";
import Base_layers_class from "../../core/base-layers";
import glfx from "../../libs/glfx";

class Effects_dotScreen_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	fx_filter: CanvasRenderingContext2D | undefined;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = undefined;
	}

	dot_screen() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Dot Screen",
			preview: true,
			effects: true,
			params: [
				{name: "size", title: "Size:", value: "3", range: [1, 20]},
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
		let canvas = this.Base_layers.convert_layer_to_canvas(undefined, true);
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

	change(canvas: HTMLCanvasElement, params: { size: any; }) {
		if (this.fx_filter) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		let size = parseFloat(params.size);

		let texture = this.fx_filter.texture(canvas);
		this.fx_filter?.draw(texture).dotScreen(Math.round(canvas.width / 2), Math.round(canvas.height / 2), 0, size).update();

		return this.fx_filter;
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//modify
		let params = {
			size: 3,
		};
		let data = this.change(canvas_thumb, params);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_dotScreen_class;
