// @ts-nocheck
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";
import Helper_class from "../../libs/helpers";

class Image_histogram_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Helper: Helper_class;

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	histogram() {
		let _this = this;

		let settings = {
			title: "Histogram",
			on_change: function (params: any) {
				_this.histogram_onload(params);
			},
			params: [
				{name: "channel", title: "Channel:", values: ["Gray", "Red", "Green", "Blue"], },
				{title: "Histogram:", function: function () {
						let html = "<canvas style=\"position:relative;\" id=\"c_h\" width=\"256\" height=\"100\"></canvas>";
						return html;
					}},
				{title: "Total pixels:", value: ""},
				{title: "Average:", value: ""},
			],
		};
		this.POP.show(settings as any);

		this.histogram_onload({});
	}

	histogram_onload(params: { channel?: any; }) {
		//get canvas from layer
		let canvas = this.Base_layers.convert_layer_to_canvas(config.layer.id);
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let imgData = img.data;

		let channel = 0;
		if (params.channel == "Red")
			channel = 1;
		else if (params.channel == "Green")
			channel = 2;
		else if (params.channel == "Blue")
			channel = 3;

		let hist_data = [[], [], [], []]; //grey, red, green, blue
		let total = imgData.length / 4;
		let sum = 0;
		let grey;

		for (let i = 0; i < imgData.length; i += 4) {
			//collect grey
			grey = Math.round((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3);
			sum = sum + imgData[i] + imgData[i + 1] + imgData[i + 2];
			if (hist_data[0][grey] == undefined)
				hist_data[0][grey] = 1;
			else
				hist_data[0][grey]++;

			//collect colors
			for (let c = 0; c < 3; c++) {
				if (c + 1 != channel)
					continue;
				if (hist_data[c + 1][imgData[i + c]] == undefined)
					hist_data[c + 1][imgData[i + c]] = 1;
				else
					hist_data[c + 1][imgData[i + c]]++;
			}
		}

		let c = (document.getElementById("c_h") as HTMLCanvasElement).getContext("2d") as CanvasRenderingContext2D;
		c.rect(0, 0, 256, 100);
		c.fillStyle = "#ffffff";
		c.fill();
		let opacity = 1;

		//draw histogram
		for (let h in hist_data) {
			for (let i = 0; i <= 255; i++) {
				if (h != channel)
					continue;
				if (hist_data[h][i] == 0)
					continue;
				c.beginPath();

				if (h == 0)
					c.strokeStyle = `rgba(64, 64, 64, ${  opacity * 2  })`;
				else if (h == 1)
					c.strokeStyle = `rgba(255, 0, 0, ${  opacity  })`;
				else if (h == 2)
					c.strokeStyle = `rgba(0, 255, 0, ${  opacity  })`;
				else if (h == 3)
					c.strokeStyle = `rgba(0, 0, 255, ${  opacity  })`;

				c.lineWidth = 1;
				c.moveTo(i + 0.5, 100 + 0.5);
				c.lineTo(i + 0.5, 100 - Math.round(hist_data[h][i] * 255 * 100 / total / 6) + 0.5);
				c.stroke();
			}
		}

		document.getElementById("pop_data_totalpixel").innerHTML = this.Helper.number_format(total, 0);
		let average;
		if (total > 0)
			average = Math.round(sum * 10 / total / 3) / 10;
		else
			average = "-";
		document.getElementById("pop_data_average").innerHTML = average;

		canvas.width = 1;
		canvas.height = 1;
	}

}

export default Image_histogram_class;