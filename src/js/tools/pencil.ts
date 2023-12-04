import app from "../app.js";
import config from "../config.js";
import Base_tools_class from "../core/base-tools.js";
import Base_layers_class from "../core/base-layers.js";

class Pencil_class extends Base_tools_class {
  private pressure_supported: boolean;
  private pointer_pressure: number;
  private layer: Base_layers_class;
  private params_hash: string;

	constructor() {
		super();
		this.Base_layers = new Base_layers_class();
		this.name = "pencil";
		this.layer = new Base_layers_class();
		this.params_hash = "";
		this.pressure_supported = false;
		this.pointer_pressure = 0; // has range [0 - 1]
	}

	load() {
		//pointer events


		document.addEventListener("pointerdown",  (event)=> {
			this.pointerdown(event);
		});
		document.addEventListener("pointermove",  (event) => {
			this.pointermove(event);
		});

		this.default_events();
	}

	dragMove(event: MouseEvent) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);
	}

	pointerdown(e: PointerEvent) {
		// Devices that don't actually support pen pressure can give 0.5 as a false reading.
		// It is highly unlikely a real pen will read exactly 0.5 at the start of a stroke.
		if (e.pressure && e.pressure !== 0 && e.pressure !== 0.5 && e.pressure <= 1) {
			this.pressure_supported = true;
			this.pointer_pressure = e.pressure;
		} else {
			this.pressure_supported = false;
		}
	}

	pointermove(e: PointerEvent) {
		// Pressure of exactly 1 seems to be an input error, sometimes I see it when lifting the pen
		// off the screen when pressure reading should be near 0.
		if (this.pressure_supported && e.pressure < 1) {
			this.pointer_pressure = e.pressure;
		}
	}

	mousedown(e: MouseEvent) {
		/*let mouse = this.get_mouse_info(e);*/
		/*i f (mouse.click_valid == false)
			return;*/

    const params_hash = this.get_params_hash();
    const opacity = Math.round(config.ALPHA / 255 * 100);

    if (config.layer?.type != this.name || params_hash != this.params_hash) {
			//register new object - current layer is not ours or params changed
			this.layer = {
				type: this.name,
				data: [],
				opacity: opacity,
				params: this.clone(this.getParams()),
				status: "draft",
				render_function: [this.name, "render"],
				x: 0,
				y: 0,
				width: config.WIDTH,
				height: config.HEIGHT,
				hide_selection_if_active: true,
				rotate: 0,
				is_vector: true,
				color: config.COLOR
			};
			app.State?.do_action(
				new app.Actions.Bundle_action("new_pencil_layer", "New Pencil Layer", [
					new app.Actions.Insert_layer_action(this.layer)
				])
			);
			this.params_hash = params_hash;
		}
		else {
			//continue adding layer data, just register break
			const new_data = JSON.parse(JSON.stringify(config.layer.data));
			new_data.push(null);
			app.State?.do_action(
				new app.Actions.Bundle_action("update_pencil_layer", "Update Pencil Layer", [
					new app.Actions.Update_layer_action(config.layer.id, {
						data: new_data
					})
				])
			);
		}
	}

	mousemove(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
			return;
		}

		//detect line size
		let size = params.size;
		let new_size = size;

		if (params.pressure == true && this.pressure_supported) {
			new_size = size * this.pointer_pressure * 2;
		}

		//more data
		config.layer.data.push([
			Math.ceil(mouse.x - config.layer.x),
			Math.ceil(mouse.y - config.layer.y),
			new_size
		]);
		this.Base_layers.render();
	}

	mouseup(e: MouseEvent) {
		let mouse = this.get_mouse_info(e);
		let params = this.getParams();
		if (mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		//detect line size
		let size = params.size;
		let new_size = size;

		if (params.pressure == true && this.pressure_supported) {
			new_size = size * this.pointer_pressure * 2;
		}

		//more data
		config.layer.data.push([
			Math.ceil(mouse.x - config.layer.x),
			Math.ceil(mouse.y - config.layer.y),
			new_size
		]);

		this.check_dimensions();

		config.layer.status = null;
		this.Base_layers.render();
	}

	render(ctx: CanvasRenderingContext2D, layer: any) {
		this.render_aliased(ctx, layer);
	}
	
	/**
	 * draw without antialiasing, sharp, ugly mode.
	 *
	 * @param {object} ctx
	 * @param {object} layer
	 */
	render_aliased(ctx: CanvasRenderingContext2DfillStyle: any; strokeStyle: any; translate: (arg0: number, arg1: number) => void; beginPath: () => void; moveTo: (arg0: any, arg1: any) => void; fillRect: (arg0: number, arg1: number, arg2: any, arg3: any) => void; }, layer: { data: string | any[]; params: any; color: any; x: number; y: number; }) {
		if (layer.data.length == 0)
			return;

		let params = layer.params;
		let data = layer.data;
		let n = data.length;
		let size = params.size;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.translate(layer.x, layer.y);

		//draw
		ctx.beginPath();
		ctx.moveTo(data[0][0], data[0][1]);
		for (let i = 1; i < n; i++) {
			if (data[i] === null) {
				//break
				ctx.beginPath();
			}
			else {
				//line
				size = data[i][2];
				if(size == undefined){
					size = 1;
				}

				if (data[i - 1] == null) {
					//exception - point
					ctx.fillRect(
						data[i][0] - Math.floor(size / 2) - 1,
						data[i][1] - Math.floor(size / 2) - 1,
						size,
						size
					);
				}
				else {
					//lines
					ctx.beginPath();
					this.draw_simple_line(
						ctx,
						data[i - 1][0],
						data[i - 1][1],
						data[i][0],
						data[i][1],
						size
					);
				}
			}
		}
		if (n == 1 || data[1] == null) {
			//point
			ctx.beginPath();
			ctx.fillRect(
				data[0][0] - Math.floor(size / 2) - 1,
				data[0][1] - Math.floor(size / 2) - 1,
				size,
				size
			);
		}

		ctx.translate(-layer.x, -layer.y);
	}

	/**
	 * draws line without aliasing
	 *
	 * @param {object} ctx
	 * @param {int} from_x
	 * @param {int} from_y
	 * @param {int} to_x
	 * @param {int} to_y
	 * @param {int} size
	 */
	draw_simple_line(ctx: CanvasRenderingContext2DfillRect: (arg0: number, arg1: number, arg2: any, arg3: any) => void; }, from_x: number, from_y: number, to_x: number, to_y: number, size: number) {
		let dist_x = from_x - to_x;
		let dist_y = from_y - to_y;
		let distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
		let radiance = Math.atan2(dist_y, dist_x);

		for (let j = 0; j < distance; j++) {
			let x_tmp = Math.round(to_x + Math.cos(radiance) * j) - Math.floor(size / 2) - 1;
			let y_tmp = Math.round(to_y + Math.sin(radiance) * j) - Math.floor(size / 2) - 1;

			ctx.fillRect(x_tmp, y_tmp, size, size);
		}
	}

	/**
	 * recalculate layer x, y, width and height values.
	 */
	check_dimensions() {
		if(config.layer.data.length == 0)
			return;

		//find bounds
		let data = JSON.parse(JSON.stringify(config.layer.data)); // Deep copy for history
		let min_x = data[0][0];
		let min_y = data[0][1];
		let max_x = data[0][0];
		let max_y = data[0][1];
		for(let i in data){
			if(data[i] === null)
				continue;
			min_x = Math.min(min_x, data[i][0]);
			min_y = Math.min(min_y, data[i][1]);
			max_x = Math.max(max_x, data[i][0]);
			max_y = Math.max(max_y, data[i][1]);
		}

		//move current data
		for(let i in data){
			if(data[i] === null)
				continue;
			data[i][0] = data[i][0] - min_x;
			data[i][1] = data[i][1] - min_y;
		}

		//change layers bounds
		app.State?.do_action(
			new app.Actions.Update_layer_action(config.layer.id, {
				x: config.layer.x + min_x,
				y: config.layer.y + min_y,
				width: max_x - min_x,
				height: max_y - min_y,
				data
			}),
			{
				merge_with_history: ["new_pencil_layer", "update_pencil_layer"]
			}
		);
	}

}

export default Pencil_class;
