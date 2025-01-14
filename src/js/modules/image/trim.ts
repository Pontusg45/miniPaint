// @ts-nocheck
import app from "../../app";
import config from "../../config";
import Base_gui_class from "../../core/base-gui";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";
import Helper_class from "../../libs/helpers";
import {Base_action} from "../../actions/base";

let instance: Image_trim_class | null = null;

class Image_trim_class {
  private Base_layers: Base_layers_class | undefined;
  private Base_gui: Base_gui_class | undefined;
  private Helper: Helper_class | undefined;
  private Dialog: Dialog_class | undefined;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
    // eslint-disable-next-line @typescript-eslint/no-this-alias
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Helper = new Helper_class();
		this.Dialog = new Dialog_class();
				
		this.set_events();
	}

	set_events() {
		document.addEventListener("keydown", (event) => {
      const code = event.keyCode;
      
			if (event.target && this.Helper?.is_input(event.target))
				return;

			if (code == 84) {
				//trim
				this.trim();
				event.preventDefault();
			}
		}, false);
	}

	trim() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    let removeWhiteColor = false;
		if(!config.TRANSPARENCY) {
			removeWhiteColor = true;
    }

    const settings = {
			title: "Trim",
			params: [
				{name: "trim_layer", title: "Trim layer:", value: true},
				{name: "trim_all", title: "Trim borders:", value: true},
				{name: "power", title: "Power:", value: 0, max: 255},
				{name: "remove_white", title: "Trim white color?", value: removeWhiteColor},
			],
			on_finish: async (params: { trim_layer: boolean; remove_white: boolean | undefined; power: number | undefined; trim_all: boolean; }) => {
				if (params.trim_layer) {
					//first trim
					let actions: Base_action[] = [];
					actions = actions.concat(this.trim_layer(config.layer.id, params.remove_white, params.power));
					await app.State?.do_action(
						new app.Actions.Bundle_action("trim_layers", "Trim Layers", actions)
					);
				}
				if (params.trim_all == true) {
					//second trim
					let actions = [];
					actions = actions.concat(_this.trim_all(params.remove_white, params.power));
					app.State?.do_action(
						new app.Actions.Bundle_action("trim_layers", "Trim Layers", actions)
					);
				}
			},
		};
		this.Dialog?.show(settings);
	}

	/**
	 * removes empty (white/transparent) area from top, right, bottom and left sides
	 * This affects layer data
	 *
	 * @param layer_id
	 * @param removeWhiteColor
	 * @param {int} power
	 */
	trim_layer(layer_id: string | number , removeWhiteColor = false, power = 0) {
    const layer = this.Base_layers?.get_layer(layer_id);
    if (!layer) {
      return;
    }
		if (layer.type != "image") {
			alert("Skip - layer must be image.");
			return false;
		}
		
		let trim = this.get_trim_info(layer_id, removeWhiteColor, power);
		trim = trim.relative;
	
		//if image was stretched
		const width_ratio = (layer.width / layer.width_original);
		const height_ratio = (layer.height / layer.height_original);

		//create smaller canvas
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = trim.width / width_ratio;
		canvas.height = trim.height / height_ratio;

		//cut required part
		ctx.translate(-trim.left / width_ratio, -trim.top / height_ratio);
		canvas.getContext("2d").drawImage(layer.link, 0, 0);
		ctx.translate(0, 0);

		return [
			new app.Actions.Update_layer_image_action(canvas, layer.id),
			new app.Actions.Update_layer_action(layer.id, {
				x: layer.x + trim.left,
				y: layer.y + trim.top,
				width: Math.ceil(canvas.width * width_ratio),
				height: Math.ceil(canvas.height * height_ratio),
				width_original: canvas.width,
				height_original: canvas.height
			})
		];
	}

	/**
	 * change canvas size, so there is no empty (white/transparent) areas on top, right, bottom and left sides
	 * this affect canvas size and all layers positions
	 *
	 * @param removeWhiteColor
	 * @param {int} power
	 */
	trim_all(removeWhiteColor = false, power = 0) {
		const actions = [];

		let all_top = config.HEIGHT;
		let all_left = config.WIDTH;
		let all_bottom = config.HEIGHT;
		let all_right = config.WIDTH;

		if (removeWhiteColor == undefined) {
			removeWhiteColor = false;
			if (config.TRANSPARENCY == false) {
				removeWhiteColor = true;
			}
		}

		//collect info
		for (let i = 0; i < config.layers.length; i++) {
			const layer = config.layers[i];
			
			if (layer.width == null || layer.height == null || layer.x == null || layer.y == null) {
				//layer without dimensions
				const trim_info = this.get_trim_info(layer.id, removeWhiteColor, power);

				all_top = Math.min(all_top, trim_info.top);
				all_left = Math.min(all_left, trim_info.left);
				all_bottom = Math.min(all_bottom, trim_info.bottom);
				all_right = Math.min(all_right, trim_info.right);
			}
			else{
				all_top = Math.min(all_top, layer.y);
				all_left = Math.min(all_left, layer.x);
				all_bottom = Math.min(all_bottom, config.HEIGHT - layer.height - layer.y);
				all_right = Math.min(all_right, config.WIDTH - layer.width - layer.x);
			}
		}

		//move every layer
		for (let i = 0; i < config.layers.length; i++) {
			const layer = config.layers[i];
			if (layer.x == null || layer.y == null || layer.type == null)
				continue;
			
			actions.push(
				new app.Actions.Update_layer_action(layer.id, {
					x: layer.x - all_left,
					y: layer.y - all_top
				})
			);
		}

		//resize
		actions.push(
			new app.Actions.Prepare_canvas_action("undo"),
			new app.Actions.Update_config_action({
				WIDTH: Math.max(1, config.WIDTH - all_left - all_right),
				HEIGHT: Math.max(1, config.HEIGHT - all_top - all_bottom)
			}),
			new app.Actions.Prepare_canvas_action("do")
		);
		return actions;
	}
	
	/**
	 * get painted area coords
	 * 
	 * @param {int} layer_id
	 * @param {boolean} trim_white
	 * @param {int} power
	 * @returns {object} keys: top, left, bottom, right, width, height, relative
	 */
	get_trim_info(layer_id: number, trim_white?: boolean, power?: number) {
		let x;
    let k;
    let y;
    if (trim_white == undefined) {
			trim_white = false;
			if (config.TRANSPARENCY == false) {
				trim_white = true;
			}
		}
		if (power == undefined) {
			power = 0;
		}
    const layer = this.Base_layers?.get_layer(layer_id);

    const canvas = this.Base_layers.convert_layer_to_canvas(layer_id, null, false);
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const imgData = img.data;

		let top = 0;
		let left = 0;
		let bottom = 0;
		let right = 0;

		//check top
		main1:
			for (y = 0; y < img.height; y++) {
			for (x = 0; x < img.width; x++) {
        k = ((y * (img.width * 4)) + (x * 4));
        if (imgData[k + 3] <= power)
					continue; //transparent 
				if (trim_white == true && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power
					&& imgData[k + 2] >= 255 - power)
					continue; //white
				break main1;
			}
			top++;
		}
		//check left
		main2:
			for (x = 0; x < img.width; x++) {
			for (y = 0; y < img.height; y++) {
				k = ((y * (img.width * 4)) + (x * 4));
				if (imgData[k + 3] <= power)
					continue; //transparent 
				if (trim_white == true && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power
					&& imgData[k + 2] >= 255 - power)
					continue; //white
				break main2;
			}
			left++;
		}
		//check bottom
		main3:
			for (y = img.height - 1; y >= 0; y--) {
			for (x = img.width - 1; x >= 0; x--) {
				k = ((y * (img.width * 4)) + (x * 4));
				if (imgData[k + 3] <= power)
					continue; //transparent 
				if (trim_white && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power
					&& imgData[k + 2] >= 255 - power)
					continue; //white
				break main3;
			}
			bottom++;
		}
		//check right
		main4:
			for (x = img.width - 1; x >= 0; x--) {
			for (y = img.height - 1; y >= 0; y--) {
				k = ((y * (img.width * 4)) + (x * 4));
				if (imgData[k + 3] <= power)
					continue; //transparent 
				if (trim_white && imgData[k] >= 255 - power && imgData[k + 1] >= 255 - power
					&& imgData[k + 2] >= 255 - power)
					continue; //white
				break main4;
			}
			right++;
		}
		
		const top_rel = top - layer?.y;
		const left_rel = left - layer?.x;
		const bottom_rel = bottom - (config.HEIGHT - layer.y - layer.height);
		const right_rel = right - (config.WIDTH - layer.x - layer.width);

		return {
			top: top,
			left: left,
			bottom: bottom,
			right: right,
			width: canvas.width - left - right,
			height: canvas.height - top - bottom,
			relative: {
				top: top_rel,
				left: left_rel,
				bottom: bottom_rel,
				right: right_rel,
				width: canvas.width - left - right,
				height: canvas.height - top - bottom,
			},
		};
	}
}

export default Image_trim_class;
