// @ts-nocheck
import app from "../app";
import config from "../config";
import Base_tools_class from "../core/base-tools";
import Base_layers_class from "../core/base-layers";
import Dialog_class from "../libs/popup";
import GUI_tools_class from "../core/gui/gui-tools";

let instance: Shape_class | null = null;

class Shape_class extends Base_tools_class {
	private GUI_tools: GUI_tools_class | undefined;
	private POP: Dialog_class | undefined;
	private ctx: CanvasRenderingContext2D | undefined;
	private layer: object | undefined;
	private preview_width: number | undefined;
	private preview_height: number | undefined;

	constructor(ctx: CanvasRenderingContext2D) {
		super();

		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.GUI_tools = new GUI_tools_class();
		this.POP = new Dialog_class();
		this.ctx = ctx;
		this.name = "shape";
		this.layer = {};
		this.preview_width = 150;
		this.preview_height = 120;

		this.set_events();
	}

	set_events() {
		document.addEventListener("keydown", (event) => {
			const code = event.keyCode;
			if (this.Helper.is_input(event.target))
				return;

			if (code == 72) {
				//H
				this.show_shapes();
			}
		}, false);
	}

	load() {

	}

	on_activate() {
		this.show_shapes();
	}

	async show_shapes() {
		const _this = this;
		let html = "";

		const data = this.get_shapes();

		for (const dataObject of data) {
			html += "<div class=\"item\">";
			html += `	<canvas id="c_${dataObject.key}" width="${this.preview_width}" height="${this.preview_height}" class="effectsPreview" data-key="${data[i].key}"></canvas>`;
			html += `<div class="preview-item-title">${data[i].title}</div>`;
			html += "</div>";
		}
		for (let i = 0; i < 4; i++) {
			html += "<div class=\"item\"></div>";
		}

		let settings = {
			title: "Shapes",
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
						_this.GUI_tools?.activate_tool(this.dataset.key);
						_this.POP?.hide();
					});
				}
			},
		};
		this.POP?.show(settings);

		//sleep, lets wait till DOM is finished
		await new Promise(r => setTimeout(r, 10));

		//draw demo thumbs
		for (let i in data) {
			let function_name = "demo";
			let canvas = document.getElementById(`c_${data[i].key}`);
			let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

			if (typeof data[i].object[function_name] == "undefined")
				continue;

			data[i].object[function_name](ctx, 20, 20, this.preview_width - 40, this.preview_height - 40, null);
		}
	}

	render(ctx: CanvasRenderingContext2D, layer: any) {

	}

	get_shapes() {
		const list = [];

		for (const i in this.Base_gui.GUI_tools?.tools_modules) {
			const object = this.Base_gui.GUI_tools.tools_modules[i];
			if (object.full_key.indexOf("shapes/") == -1)
				continue;

			list.push(object);
		}

		list.sort(function (a: {
			title: string;
		}, b: {
			title: string;
		}) {
			const nameA = a.title.toUpperCase();
			const nameB = b.title.toUpperCase();
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		});

		return list;
	}

}

export default Shape_class;
