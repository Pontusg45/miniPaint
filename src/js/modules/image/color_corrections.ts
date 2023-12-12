import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";
import Helper_class from "../../libs/helpers";
import ImageFilters_class from "../../libs/imagefilters";
import { ImageFiltersType } from "../../../../types/types";

class Image_colorCorrections_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Helper: Helper_class;
	ImageFilters = {} as ImageFiltersType;
	layer_active_small_ctx: CanvasRenderingContext2D | null = null;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ImageFilters = ImageFilters_class;
	}

	color_corrections() {
		let _this = this;

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let settings = {
			title: "Color Corrections",
			preview: true,
			on_change: function (params: { param_b: number; param_c: number; param_s: number; param_h: any; }, canvas_preview: { putImageData: (arg0: any, arg1: number, arg2: number) => void; filter: string; drawImage: (arg0: any, arg1: number, arg2: number) => void; }, w: any, h: any, canvas: any) {
				//destructive effects
				// @ts-ignore
				let img = this.layer_active_small_ctx.getImageData(0, 0, w, h);
				let data = _this.do_corrections(img, params);
				canvas_preview.putImageData(data, 0, 0);

				//non-destructive
				canvas_preview.filter = `brightness(${  1 + (params.param_b / 100)  })`;
				canvas_preview.filter += ` contrast(${  1 + (params.param_c / 100)  })`;
				canvas_preview.filter += ` saturate(${  1 + (params.param_s / 100)  })`;
				canvas_preview.filter += ` hue-rotate(${  params.param_h  }deg)`;

				canvas_preview.drawImage(canvas, 0, 0);
			},
			params: [
				{name: "param_b", title: "Brightness:", value: "0", range: [-100, 100]},
				{name: "param_c", title: "Contrast:", value: "0", range: [-100, 100]},
				{name: "param_s", title: "Saturation:", value: "0", range: [-100, 100]},
				{name: "param_h", title: "Hue:", value: "0", range: [-180, 180]},
				{},
				{name: "param_l", title: "Luminance:", value: "0", range: [-100, 100]},
				{},
				{name: "param_red", title: "Red channel:", value: "0", range: [-255, 255]},
				{name: "param_green", title: "Green channel:", value: "0", range: [-255, 255]},
				{name: "param_blue", title: "Blue channel:", value: "0", range: [-255, 255]}
			],
			on_finish: function (params: any) {
				_this.save_changes(params);
			},
		};
		this.POP.show(settings as any);
	}

	save_changes(params: { param_b: number; param_c: number; param_s: number; param_h: number; }) {

		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(0, true) as HTMLCanvasElement;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.do_corrections(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);

		//non-destructive filters
		//multiple do_action() + do_corrections() does not work together yet.
		if(params.param_b != 0) {
			let parameters = {value: params.param_b};
			let filter_id = undefined;
			app.State?.do_action(
				new app.Actions.Add_layer_filter_action(undefined, "brightness", parameters as any, filter_id)
			);
		}
		if(params.param_c != 0) {
			let parameters = {value: params.param_c};
			let filter_id = undefined;
			app.State?.do_action(
				new app.Actions.Add_layer_filter_action(undefined, "contrast", parameters as any, filter_id)
			);
		}
		if(params.param_s != 0) {
			let parameters = {value: params.param_s};
			let filter_id = undefined;
			app.State?.do_action(
				new app.Actions.Add_layer_filter_action(undefined, "saturate", parameters as any, filter_id)
			);
		}
		if(params.param_h != 0) {
			let parameters = {value: params.param_h};
			let filter_id = undefined;
			app.State?.do_action(
				new app.Actions.Add_layer_filter_action(0, "hue-rotate", parameters as any, filter_id)
			);
		}
	}

	/**
	 * corrections (destructive)
	 *
	 * @param data
	 * @param params
	 * @returns {*}
	 */
	do_corrections(oldData: ImageData, params: { param_b?: number; param_c?: number; param_s?: number; param_h?: any; param_l?: any; param_red?: any; param_green?: any; param_blue?: any; }) {
		//luminance
		let data = oldData;
		if(params.param_l != 0) {
			data = this.ImageFilters.HSLAdjustment(oldData, 0, 0, params.param_l);
		}

		//RGB corrections
		if(params.param_red != 0 || params.param_green != 0 || params.param_blue != 0) {
			data = this.ImageFilters.ColorTransformFilter(oldData, 1, 1, 1, 1,
				params.param_red, params.param_green, params.param_blue, 1);
		}

		return data;
	}

}

export default Image_colorCorrections_class;