import Effects_common_class from "../abstract/css";
import Base_layers_class from "../../../core/base-layers";
import config from "../../../config";

class Effects_sepia_class extends Effects_common_class {
	Base_layers: Base_layers_class;

	constructor() {
		super();
		this.Base_layers = new Base_layers_class();
	}

	sepia(filter_id: any) {
		if (config.layer.type == null) {
			alert("Layer is empty.");
			return;
		}

		let filter = this.Base_layers.find_filter_by_id(filter_id, "sepia");

		let params = [
			{name: "value", title: "Percentage:", value: filter.value ??= 60, range: [0, 100]},
		];
		this.show_dialog("sepia", params, filter_id);
	}

	convert_value(value: number) {
		let system_value = value / 100;

		return system_value;
	}

	demo(canvas_id: string, canvas_thumb: any){
		let canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//draw
		let size = this.convert_value(60);
		ctx.filter = `sepia(${size})`;
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = "none";
	}

	render_pre(ctx: CanvasRenderingContext2D, data: { params: { value: any; }; }) {
		let value = this.convert_value(data.params.value);
		let filter = `sepia(${  value  })`;

		if(ctx.filter == "none")
			ctx.filter = filter;
		else
			ctx.filter += ` ${  filter}`;
	}

	render_post(ctx: CanvasRenderingContext2D, data: any){
		ctx.filter = "none";
	}

}

export default Effects_sepia_class;