import app from "../../../app";
import config from "../../../config";
import Dialog_class from "../../../libs/popup";
import Base_layers_class from "../../../core/base-layers";
import Helper_class from "../../../libs/helpers";

class Effects_common_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Helper: Helper_class;
	params: null;
	preview_padding: any;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.params = null;
	}

	show_dialog(type: string, params: { name: string; title: string; value: any; range: number[]; }[] | ({ name: string; title: string; value: any; range: number[]; type?: undefined; } | { name: string; title: string; value: any; type: string; range?: undefined; })[], filter_id: number) {
		let _this = this;
		let title = this.Helper.ucfirst(type);
		title = title.replace(/-/g, " ");

		let preview_padding = 0;
		if(typeof this.preview_padding != "undefined"){
			preview_padding = this.preview_padding;
		}

		let settings = {
			title: title,
			preview: true,
			preview_padding: preview_padding,
			effects: true,
			params: params,
			on_change: function (params: any, canvas_preview: CanvasRenderingContext2D, w: any, h: any) {
				_this.params = params;
				canvas_preview.filter = _this.preview(params, type);
				// @ts-ignore
				canvas_preview.drawImage(this.layer_active_small as any,
					preview_padding, preview_padding,
					_this.POP.width_mini - preview_padding * 2, _this.POP.height_mini - preview_padding * 2
				);
			},
			on_finish: function (params: any) {
				_this.params = params;
				_this.save(params, type, filter_id);
			},
		};
		this.Base_layers.disable_filter(filter_id);
		this.POP.show(settings as any);
		this.Base_layers.disable_filter(0);
	}

	save(params: undefined, type: string | undefined, filter_id: number) {
		return app.State?.do_action(
			new app.Actions.Add_layer_filter_action(undefined, type, params, filter_id)
		);
	}

	preview(params: { value: any; }, type: string) {
		if(type == "shadow"){
			type = "drop-shadow";
		}

		let value = this.convert_value(params.value, params, "preview");
		return `${type  }(${  value  })`;
	}

	convert_value(value: number, params: { value: any; x?: number; y?: number; color?: string; } | null | undefined, mode: string): string | number {
		return value.toString();
	}

}

export default Effects_common_class;