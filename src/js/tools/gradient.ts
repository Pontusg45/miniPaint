import app from "../app.js";
import config from "../config.js";
import Base_tools_class from "../core/base-tools.js";
import Base_layers_class from "../core/base-layers.js";
import Helper_class from "../libs/helpers.js";

class Gradient_class extends Base_tools_class {

	constructor(ctx: CanvasRenderingContext2D) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = "gradient";
		this.layer = {};
	}

	load() {
		this.default_events();
	}

	mousedown(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams()
		let name = this.name;
		let is_vector = false;
		if (params.radial == true) {
			name = "Radial gradient";
			is_vector = true;
		}

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			name: `${this.Helper.ucfirst(name)  } #${  this.Base_layers.auto_increment}`,
			params: this.clone(this.getParams()),
			status: "draft",
			render_function: [this.name, "render"],
			x: mouse.x,
			y: mouse.y,
			rotate: null,
			is_vector: is_vector,
			color: null,
			data: {
				center_x: mouse.x,
				center_y: mouse.y,
			},
		};
		app.State?.do_action(
			new app.Actions.Bundle_action("new_gradient_layer", "New Gradient Layer", [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
			return;
		}

		let width = mouse.x - this.layer.x;
		let height = mouse.y - this.layer.y;

		if (params.radial == true) {
			config.layer.x = this.layer.data.center_x - width;
			config.layer.y = this.layer.data.center_y - height;
			config.layer.width = width * 2;
			config.layer.height = height * 2;
		}
		else {
			config.layer.width = width;
			config.layer.height = height;
		}

		this.Base_layers.render();
	}

	mouseup(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		let width = mouse.x - this.layer.x;
		let height = mouse.y - this.layer.y;

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			app.State.scrap_last_action();
			return;
		}

		let new_settings = {};
		if (params.radial == true) {
			new_settings = {
				x: this.layer.data.center_x - width,
				y: this.layer.data.center_y - height,
				width: width * 2,
				height: height * 2
			};
		}
		else {
			new_settings = {
				width,
				height
			};
		}
		new_settings.status = null;

		app.State?.do_action(
			new app.Actions.Update_layer_action(config.layer.id, new_settings),
			{ merge_with_history: "new_gradient_layer" }
		);

		this.Base_layers.render();
	}

	render(ctx: CanvasRenderingContext2DbeginPath: () => void; rect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; createLinearGradient: (arg0: any, arg1: any, arg2: number, arg3: number) => any; fillStyle: any; fill: () => void; createRadialGradient: (arg0: any, arg1: any, arg2: number, arg3: any, arg4: any, arg5: number) => any; fillRect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; }, layer: { width: number; height: number; params: any; x: number; y: number; }) {
		if (layer.width == 0 && layer.height == 0)
			return;

		let params = layer.params;
		let power = params.radial_power;
		if(power > 99){
			power = 99;
		}
		let alpha = params.alpha / 100 * 255;
		if(power > 255){
			power = 255;
		}

		let color1 = params.color_1;
		let color2 = params.color_2;
		let radial = params.radial;

		let color2_rgb = this.Helper.hexToRgb(color2);

		let width = layer.x + layer.width - 1;
		let height = layer.y + layer.height - 1;

		if (radial == false) {
			//linear
			ctx.beginPath();
			ctx.rect(0, 0, config.WIDTH, config.HEIGHT);
			let grd = ctx.createLinearGradient(
				layer.x, layer.y,
				width, height);

			grd.addColorStop(0, color1);
			grd.addColorStop(1, `rgba(${  color2_rgb.r  }, ${  color2_rgb.g  }, ${
				 color2_rgb.b  }, ${  alpha / 255  })`);
			ctx.fillStyle = grd;
			ctx.fill();
		}
		else {
			//radial
			let dist_x = layer.width;
			let dist_y = layer.height;
			let center_x = layer.x + Math.round(layer.width / 2);
			let center_y = layer.y + Math.round(layer.height / 2);
			let distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
			let radgrad = ctx.createRadialGradient(
				center_x, center_y, distance * power / 100,
				center_x, center_y, distance);

			radgrad.addColorStop(0, color1);
			radgrad.addColorStop(1, `rgba(${  color2_rgb.r  }, ${  color2_rgb.g  }, ${
				 color2_rgb.b  }, ${  alpha / 255  })`);
			ctx.fillStyle = radgrad;
			ctx.fillRect(0, 0, config.WIDTH, config.HEIGHT);
		}
	}

}
export default Gradient_class;
