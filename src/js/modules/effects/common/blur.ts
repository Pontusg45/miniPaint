import config from "../../../config";
import Effects_common_class from "../abstract/css";
import Dialog_class from "../../../libs/popup";
import Base_layers_class from "../../../core/base-layers";

class Effects_blur_class extends Effects_common_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;

	constructor() {
		super();
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	blur(filter_id: number) {
		if (config.layer.type == null) {
			alert("Layer is empty.");
			return;
		}

		let filter = this.Base_layers.find_filter_by_id(filter_id, "blur");

		let params = [
			{name: "value", title: "Percentage:", value: filter.value ??= 5, range: [0, 50]},
		];
		this.show_dialog("blur", params, filter_id);
	}

	convert_value(value: number, params: { value: any; x?: number; y?: number; color?: string; } | null | undefined, mode: string) : string {

		//adapt size to real canvas dimensions
		if (mode == "preview") {
			let diff = (this.POP.width_mini / this.POP.height_mini) / (config.WIDTH / config.HEIGHT);

			value = value * diff;
		}

		return `${value  }px`;
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//draw
		let size = this.convert_value(5, null, "preview");
		ctx.filter = `blur(${size})`;
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = "none";
	}

	render_pre(ctx: CanvasRenderingContext2D, data: { params: { value: any; }; }) {
		let value = this.convert_value(data.params.value, data.params, "save");
		let filter = `blur(${  value  })`;

		if(ctx.filter == "none")
			ctx.filter = filter;
		else
			ctx.filter += ` ${  filter}`;
	}

	render_post(ctx: CanvasRenderingContext2D, data: any){
		ctx.filter = "none";
	}

}

export default Effects_blur_class;