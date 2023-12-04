import app from "../../app.js";
import config from "../../config.js";
import Base_layers_class from "../../core/base-layers.js";
import Dialog_class from "../../libs/popup.js";
import Helper_class from "../../libs/helpers.js";

let instance: Image_autoAdjust_class | null = null;

class Image_autoAdjust_class {
	POP: Dialog_class = new Dialog_class;
	Base_layers: Base_layers_class = new Base_layers_class;
	Helper: Helper_class = new Helper_class;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;


		this.set_events();
	}

	set_events() {
		document.addEventListener("keydown", (event) => {
			let code = event.keyCode;
			if (event.target && this.Helper.is_input(event.target))
				return;

			if (code == 70 && event.ctrlKey != true && event.metaKey != true) {
				//F - adjust
				this.auto_adjust();
				event.preventDefault();
			}
		}, false);
	}

	auto_adjust() {
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		let ctx = canvas.getContext("2d");

		//change data
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let data = this.get_adjust_data(img);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State?.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	get_adjust_data(data: ImageData) {
		//settings
		let white = 240;	//white color min
		let black = 30;		//black color max
		let target_white = 1; 	//how much % white colors should take
		let target_black = 0.5;	//how much % black colors should take
		let modify = 1.1;	//color modify strength
		let cycles_count = 10; //how much iteration to change colors

		let imgData = data.data;
		let W = data.width;
		let H = data.height;

		let n = 0;	//pixels count without transparent

		//make sure we have white
		let n_valid = 0;
		for (let i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 > white)
				n_valid++;
			n++;
		}
		let target = target_white;
		let n_fix_white = 0;
		let done = false;
		for (let j = 0; j < cycles_count; j++) {
			if (n_valid * 100 / n >= target)
				done = true;
			if (done == true)
				break;
			n_fix_white++;

			//adjust
			for (let i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				for (let c = 0; c < 3; c++) {
					let x = i + c;
					if (imgData[x] < 10)
						continue;
					//increase white
					imgData[x] *= modify;
					imgData[x] = Math.round(imgData[x]);
					if (imgData[x] > 255)
						imgData[x] = 255;
				}
			}

			//recheck
			n_valid = 0;
			for (let i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 > white)
					n_valid++;
			}
		}

		//make sure we have black
		n_valid = 0;
		for (let i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 < black)
				n_valid++;
		}
		target = target_black;
		let n_fix_black = 0;
		let done = false;
		for (let j = 0; j < cycles_count; j++) {
			if (n_valid * 100 / n >= target)
				done = true;
			if (done == true)
				break;
			n_fix_black++;

			//adjust
			for (let i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				for (let c = 0; c < 3; c++) {
					let x = i + c;
					if (imgData[x] > 240)
						continue;
					//increase black
					imgData[x] -= (255 - imgData[x]) * modify - (255 - imgData[x]);
					imgData[x] = Math.round(imgData[x]);
				}
			}

			//recheck
			n_valid = 0;
			for (let i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 < black)
					n_valid++;
			}
		}
		//log('Iterations: brighten='+n_fix_white+", darken="+n_fix_black);

		return data;
	}
}

export default Image_autoAdjust_class;