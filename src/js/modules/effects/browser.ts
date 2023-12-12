import config from "../../config";
import Base_tools_class from "../../core/base-tools";
import Dialog_class from "../../libs/popup";

class Effects_browser_class extends Base_tools_class {

	preview_width: number;
	preview_height: number;
	POP: Dialog_class;

	constructor() {
		super();
		this.POP = new Dialog_class();
		this.preview_width = 150;
		this.preview_height = 120;
	}

	async browser() {
		let _this = this;
		let html = "";

		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}

		let data = this.get_effects_list();

		for (let i in data) {
			let title = data[i].title;

			html += "<div class=\"item\">";
			html += `	<canvas id="c_${  data[i].key  }" width="${  this.preview_width  }" height="${
				 this.preview_height  }" class="effectsPreview" data-key="${
				 data[i].key  }"></canvas>`;
			html += `<div class="preview-item-title">${  title  }</div>`;
			html += "</div>";
		}
		for (let i = 0; i < 4; i++) {
			html += "<div class=\"item\"></div>";
		}

		let settings = {
			title: "Effects browser",
			className: "wide",
			on_load: function (params: any, popup: { el: { querySelector: (arg0: string) => { (): any; new(): any; appendChild: { (arg0: HTMLDivElement): void; new(): any; }; }; querySelectorAll: (arg0: string) => any; }; }) {
				let node = document.createElement("div");
				node.classList.add("flex-container");
				node.innerHTML = html;
				popup.el.querySelector(".dialog_content").appendChild(node);
				//events
				let targets = popup.el.querySelectorAll(".item canvas");
				for (let i = 0; i < targets.length; i++) {
					targets[i].addEventListener("click", function (event: any) {
						//we have click
						// @ts-ignore
						let key = this.dataset.key;
						for (let i in data) {
							if(data[i].key == key){
								let function_name = _this.get_function_from_path(key);
								_this.POP.hide(false);
								data[i].object[function_name]();
							}
						}
					});
				}
			},
		};
		this.POP.show(settings as any);

		//sleep, lets wait till DOM is finished
		await new Promise(r => setTimeout(r, 10));

		//generate thumb
		let active_image = this.Base_layers.convert_layer_to_canvas();

		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		canvas.width = this.preview_width;
		canvas.height = this.preview_height;

		ctx.scale(this.preview_width / active_image.width, this.preview_height / active_image.height);
		ctx.drawImage(active_image, 0, 0);
		ctx.scale(1, 1);

		//draw demo thumbs
		for (let i in data) {
			let title = data[i].title;
			let function_name = "demo";
			if(typeof data[i].object[function_name] == "undefined")
				continue;
			data[i].object[function_name](`c_${data[i].key}`, canvas);
		}
	}

	get_effects_list() {
		let list = [];

		for (let i in this.Base_gui.modules) {
			if (i.indexOf("effects") == -1 || i.indexOf("abstract") > -1 || i.indexOf("browser") > -1)
				continue;

			list.push({
				title: this.get_filter_title(i),
				key: i,
				object: this.Base_gui.modules[i],
			});
		}

		list.sort(function(a, b) {
			let nameA = a.title.toUpperCase();
			let nameB = b.title.toUpperCase();
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		});

		return list;
	}

	get_filter_title(key: string) {
		let parts = key.split("/");
		let title = parts[parts.length - 1];

		//exceptions
		if (title == "negative")
			title = "invert";

		title = title.replace(/_/g, " ");
		title = title.charAt(0).toUpperCase() + title.slice(1); //make first letter uppercase

		return title;
	}

	get_function_from_path(path: string){
		let parts = path.split("/");
		let result = parts[parts.length - 1];
		result = result.replace(/-/, "_");

		return result;
	}
}

export default Effects_browser_class;
