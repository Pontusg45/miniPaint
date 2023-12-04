import Effects_common_class from "../abstract/css.js";
import Base_layers_class from "../../../core/base-layers.js";
import config from "../../../config.js";

class Effects_invert_class extends Effects_common_class {
	Base_layers: Base_layers_class;

	constructor() {
		super();
		this.Base_layers = new Base_layers_class();
	}

	invert(filter_id: number) {
		if (config.layer.type == null) {
			alert("Layer is empty.");
			return;
		}

		let filter = this.Base_layers.find_filter_by_id(filter_id, "invert");

		let params = [
			{name: "value", title: "Percentage:", value: filter.value ??= 100, range: [0, 100]},
		];
		this.show_dialog("invert", params, filter_id);
	}

	convert_value(value: number) {
		let system_value = value / 100;
		return system_value;
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//draw
		let size = this.convert_value(100);
		ctx.filter = `invert(${size})`;
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = "none";
	}

	render_pre(ctx: CanvasRenderingContext2D, data: { params: { value: any; }; }) {
		let value = this.convert_value(data.params.value);
		let filter = `invert(${  value  })`;

		if(ctx.filter == "none")
			ctx.filter = filter;
		else
			ctx.filter += ` ${  filter}`;
	}

	render_post(ctx: CanvasRenderingContext2D, data: any){
		ctx.filter = "none";
	}

}

export default Effects_invert_class;