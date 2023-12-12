// @ts-nocheck
import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";

class Layer_differences_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	differences() {
		let _this = this;
		if (this.Base_layers.find_previous(config.layer.id) == null) {
			alert("There are no layers behind.");
			return false;
		}

		let settings = {
			title: "Differences",
			preview: true,
			params: [
				{name: "sensitivity", title: "Sensitivity:", value: "0", range: [0, 255]},
			],
			on_change: function (params: { sensitivity: number; }, canvas_preview: any, w: any, h: any) {
				_this.calc_differences(params.sensitivity, canvas_preview, w, h);
			},
			on_finish: function (params: { sensitivity: number; }) {
				_this.calc_differences(params.sensitivity);
			},
		};
		this.POP.show(settings as any);
	}

	calc_differences(sensitivity: number, canvas_preview: { save: () => void; scale: (arg0: number, arg1: number) => void; drawImage: (arg0: HTMLCanvasElement, arg1: number, arg2: number) => void; restore: () => void; } | undefined, w: number | undefined, h: number | undefined) {
		//create tmp canvas
		let canvas = document.createElement("canvas");
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		//get source data
		this.Base_layers.render_object(ctx, config.layer);
		let imgData1 = ctx.getImageData(0, 0, config.WIDTH, config.HEIGHT).data;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		//get target data
		let next_layer = this.Base_layers.find_previous(config.layer.id);
		this.Base_layers.render_object(ctx, next_layer);
		let imgData2 = ctx.getImageData(0, 0, config.WIDTH, config.HEIGHT).data;

		//prepare background
		ctx.rect(0, 0, config.WIDTH, config.HEIGHT);
		ctx.fillStyle = "#ffffff";
		ctx.fill();

		//generate diff
		let img3 = ctx.getImageData(0, 0, config.WIDTH, config.HEIGHT);
		let imgData3 = img3.data;
		for (let xx = 0; xx < config.WIDTH; xx++) {
			for (let yy = 0; yy < config.HEIGHT; yy++) {
				let x = (xx + yy * config.WIDTH) * 4;

				if (Math.abs(imgData1[x] - imgData2[x]) > sensitivity
					|| Math.abs(imgData1[x + 1] - imgData2[x + 1]) > sensitivity
					|| Math.abs(imgData1[x + 2] - imgData2[x + 2]) > sensitivity
					|| Math.abs(imgData1[x + 3] - imgData2[x + 3]) > sensitivity) {
					imgData3[x] = 255;
					imgData3[x + 1] = 0;
					imgData3[x + 2] = 0;
					imgData3[x + 3] = 255;
				}
			}
		}
		ctx.putImageData(img3, 0, 0);

		//show
		if (canvas_preview == undefined) {
			//main
			let params: object | undefined = [];
			params.type = "image";
			params.name = "Differences";
			params.data = canvas.toDataURL("image/png");
			app.State?.do_action(
				new app.Actions.Insert_layer_action(params)
			);
		}
		else {
			//preview
			canvas_preview.save();
			canvas_preview.scale(w / config.WIDTH, h / config.HEIGHT);
			canvas_preview.drawImage(canvas, 0, 0);
			canvas_preview.restore();
		}

		canvas.width = 1;
		canvas.height = 1;
	}

}

export default Layer_differences_class;