import glfx from "./glfx.js";
import ImageFilters from "./imagefilters.js";

/**
 * adds vintage effect
 * 
 * @author ViliusL
 * 
 * Functions:
 * - adjust_color
 * - lower_contrast
 * - blur
 * - light_leak
 * - chemicals
 * - exposure
 * - grains
 * - grains_big
 * - optics
 * - dusts
 *
 * Usage:	VINTAGE.___function___(canvas,, param1, param2, ...);
 * 
 * libs:		
 * - imagefilters.js, url: https://github.com/arahaya/ImageFilters.js
 * - glfx.js url: http://evanw.github.com/glfx.js/
 */
class Vintage_class {
	fx_filter: boolean;
	exposure_rand: null;
	lightLeakX: null;
	lightLeakY: null;

	constructor(width: number, height: number) {
		this.fx_filter = false;
		this.exposure_rand = null;
		this.lightLeakX = null;
		this.lightLeakY = null;

		this.reset_random_values(width, height);
	}

	/**
	 * apply all affect
	 * 
	 * @param {canvas} canvas
	 * @param {int} level 0-100
	 */
	apply_all(canvas: HTMLElement | null, level: number) {
		//adjust from scale [0-100] to our scale.
		let red_offset = level * 1;	//[0, 100]
		let contrast = level / 2; //[0, 50]
		//let blur = level / 100; //[0, 1]
		let light_leak = level * 1.5;  //[0, 150]
		let de_saturation = level * 1; //[0, 100]
		let exposure = level * 1.5; //[0, 150]
		let grains = level / 2; //[0, 50]
		let big_grains = level / 5; //[0, 20]
		let vignette_size = level / 200; //[0, 0.5]
		let vignette_amount = level / 142; //[0, 0.7]
		let dust_level = level * 1; //[0, 100]

		this.adjust_color(canvas, red_offset);
		this.lower_contrast(canvas, contrast);
		//this.blur(canvas, blur);
		this.light_leak(canvas, light_leak);
		this.chemicals(canvas, de_saturation);
		this.exposure(canvas, exposure);
		this.grains(canvas, grains);
		this.grains_big(canvas, big_grains);
		this.optics(canvas, vignette_size, vignette_amount);
		this.dusts(canvas, dust_level);
	}

	/**
	 * reset random values again.
	 * 
	 * @param {int} width
	 * @param {int} height
	 */
	reset_random_values(width: number, height: number) {
		this.exposure_rand = this.getRandomInt(1, 10);
		this.lightLeakX = this.getRandomInt(0, width);
		this.lightLeakY = this.getRandomInt(0, height);
	}

	//increasing red color
	adjust_color(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level_red: number) {	//level = [0, 200], default 70
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		let param_green = 0;
		let param_blue = 0;
		let imageData = context.getImageData(0, 0, W, H);
		let filtered = ImageFilters.ColorTransformFilter(imageData, 1, 1, 1, 1, level_red, param_green, param_blue, 1);
		context.putImageData(filtered, 0, 0);
	}

	//decreasing contrast
	lower_contrast(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {	//level = [0, 50], default 15
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;


		let imageData = context.getImageData(0, 0, W, H);
		let filtered = ImageFilters.BrightnessContrastPhotoshop(imageData, 0, -level);
		context.putImageData(filtered, 0, 0);
	}

	//adding blur
	blur(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {	//level = [0, 2], default 0
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;


		if (level < 1)
			return context;
		let imageData = context.getImageData(0, 0, W, H);
		let filtered = ImageFilters.GaussianBlur(imageData, level);
		context.putImageData(filtered, 0, 0);
	}

	//creating transparent #ffa500 radial gradients
	light_leak(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {	//level = [0, 150], default 90
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		let click_x = this.lightLeakX;
		let click_y = this.lightLeakY;
		let distance = Math.min(W, H) * 0.6;
		let radgrad = context.createRadialGradient(
			click_x, click_y, distance * level / 255,
			click_x, click_y, distance);
		radgrad.addColorStop(0, `rgba(255, 165, 0, ${  level / 255  })`);
		radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");

		context.fillStyle = radgrad;
		context.fillRect(0, 0, W, H);
	}

	//de-saturate
	chemicals(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {	//level = [0, 100], default 40
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		let imageData = context.getImageData(0, 0, W, H);
		let filtered = ImageFilters.HSLAdjustment(imageData, 0, -level, 0);
		context.putImageData(filtered, 0, 0);
	}

	//creating transparent vertical black-to-white gradients
	exposure(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {		//level = [0, 150], default 80
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		context.rect(0, 0, W, H);
		let grd = context.createLinearGradient(0, 0, 0, H);
		if (this.exposure_rand < 5) {
			//dark at top
			grd.addColorStop(0, `rgba(0, 0, 0, ${  level / 255  })`);
			grd.addColorStop(1, `rgba(255, 255, 255, ${  level / 255  })`);
		}
		else {
			//bright at top
			grd.addColorStop(0, `rgba(255, 255, 255, ${  level / 255  })`);
			grd.addColorStop(1, `rgba(0, 0, 0, ${  level / 255  })`);
		}
		context.fillStyle = grd;
		context.fill();
	}

	//add grains, noise
	grains(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {	//level = [0, 50], default 10
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		if (level == 0)
			return context;
		let img = context.getImageData(0, 0, W, H);
		let imgData = img.data;
		for (let j = 0; j < H; j++) {
			for (let i = 0; i < W; i++) {
				let x = (i + j * W) * 4;
				if (imgData[x + 3] == 0)
					continue;	//transparent
				//increase it's lightness
				let delta = this.getRandomInt(0, level);
				if (delta == 0)
					continue;

				if (imgData[x] - delta < 0)
					imgData[x] = -(imgData[x] - delta);
				else
					imgData[x] = imgData[x] - delta;
				if (imgData[x + 1] - delta < 0)
					imgData[x + 1] = -(imgData[x + 1] - delta);
				else
					imgData[x + 1] = imgData[x + 1] - delta;
				if (imgData[x + 2] - delta < 0)
					imgData[x + 2] = -(imgData[x + 2] - delta);
				else
					imgData[x + 2] = imgData[x + 2] - delta;
			}
		}
		context.putImageData(img, 0, 0);
	}

	//add big grains, noise
	grains_big(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {	//level = [0, 50], default 20
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		if (level == 0)
			return context;
		let n = W * H / 100 * level;	//density
		let color = 200;
		for (let i = 0; i < n; i++) {
			let power = this.getRandomInt(5, 10 + level);
			let size = 2;
			let x = this.getRandomInt(0, W);
			let y = this.getRandomInt(0, H);
			context.fillStyle = `rgba(${  color  }, ${  color  }, ${  color  }, ${  power / 255  })`;
			context.fillRect(x, y, size, size);
		}
	}

	//adding vignette effect - blurred dark borders
	optics(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, param1: number, param2: number) {	//param1 [0, 0.5], param2 [0, 0.7], default 0.3, 0.5
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		let texture = this.fx_filter.texture(context.getImageData(0, 0, W, H));
		this.fx_filter.draw(texture).vignette(param1, param2).update();
		context.drawImage(this.fx_filter, 0, 0);
	}

	//add dust and hairs
	dusts(canvas: { getContext: (arg0: string) => any; width: number; height: number; }, level: number) {	//level = [0, 100], default 70
		let context = canvas.getContext("2d");
		let W = canvas.width;
		let H = canvas.height;

		let n = level / 100 * (W * H) / 1000;
		//add dust
		context.fillStyle = "rgba(200, 200, 200, 0.3)";
		for (let i = 0; i < n; i++) {
			let x = this.getRandomInt(0, W);
			let y = this.getRandomInt(0, H);
			let mode = this.getRandomInt(1, 2);
			if (mode == 1) {
				let w = 1;
				let h = this.getRandomInt(1, 3);
			}
			else if (mode == 2) {
				let w = this.getRandomInt(1, 3);
				let h = 1;
			}
			context.beginPath();
			context.rect(x, y, w, h);
			context.fill();
		}

		//add hairs
		context.strokeStyle = "rgba(200, 200, 200, 0.2)";
		for (let i = 0; i < n / 20; i++) {
			let x = this.getRandomInt(0, W);
			let y = this.getRandomInt(0, H);
			let radius = this.getRandomInt(5, 10);
			let start_nr = this.getRandomInt(0, 20) / 10;
			let start_angle = Math.PI * start_nr;
			let end_angle = Math.PI * (start_nr + this.getRandomInt(7, 15) / 10);
			context.beginPath();
			context.arc(x, y, radius, start_angle, end_angle);
			context.stroke();
		}

		return context;
	}

	//random number generator
	getRandomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

export default Vintage_class;