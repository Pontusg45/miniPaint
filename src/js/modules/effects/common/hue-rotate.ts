import Effects_common_class from "../abstract/css.js";
import Base_layers_class from "../../../core/base-layers.js";
import config from "../../../config.js";

class Effects_hueRotate_class extends Effects_common_class {
	Base_layers: Base_layers_class;

	constructor() {
		super();
		this.Base_layers = new Base_layers_class();
	}

	hue_rotate(filter_id: number) {
		if (config.layer.type == null) {
			alert("Layer is empty.");
			return;
		}

		let filter = this.Base_layers.find_filter_by_id(filter_id, "hue-rotate");

		let params = [
			{name: "value", title: "Degree:", value: filter.value ??= 90, range: [0, 360]},
		];
		this.show_dialog("hue-rotate", params, filter_id);
	}

	override convert_value(value: number) {
		return `${value}deg`;
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//draw
		let size = this.convert_value(90);
		ctx.filter = `hue-rotate(${size})`;
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = "none";
	}

	render_pre(ctx: CanvasRenderingContext2D, data: { params: { value: any; }; }) {
		let value = this.convert_value(data.params.value);
		let filter = `hue-rotate(${  value  })`;

		if(ctx.filter == "none")
			ctx.filter = filter;
		else
			ctx.filter += ` ${  filter}`;
	}

	render_post(ctx: CanvasRenderingContext2D, data: any){
		ctx.filter = "none";
	}

}

export default Effects_hueRotate_class;