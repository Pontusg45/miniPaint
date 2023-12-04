/**
 * user dialogs library
 * 
 * @author ViliusL
 * 
 * Usage:
 * 
 * import Dialog_class from './libs/popup.js';
 * let POP = new popup();
 * 
 * let settings = {
 *		title: 'Differences',
 *		comment: '',
 *		preview: true,
 *		className: '',
 *		params: [
 *			{name: "param1", title: "Parameter #1:", value: "111"},
 *			{name: "param2", title: "Parameter #2:", value: "222"},
 *		],
 *		on_load: function(params){...},
 *		on_change: function(params, canvas_preview, w, h){...},
 *		on_finish: function(params){...},
 *		on_cancel: function(params){...},
 * };
 * this.POP.show(settings);
 * 
 * Params types:
 * - name		type				example
 * - ---------------------------------------------------------------
 * - name		string				'parameter1'
 * - title		string				'enter value:'
 * - type		string				'select', 'textarea', 'color'
 * - value		string				'314'
 * - values		array fo strings	['one', 'two', 'three']
 * - range		numbers interval	[0, 255]
 * - step		int/float			1	
 * - placeholder	text			'enter number here'
 * - html		html text			'<b>bold</b>'
 * - function	function			'custom_function'
 */
import "./../../css/popup.css";
import Base_layers_class from "../core/base-layers.js";
import Base_gui_class from "../core/base-gui.js";
import Tools_translate_class from "../modules/tools/translate.js";
import BaseGui from "../core/base-gui.js";
import BaseLayers from "../core/base-layers.js";
import {DialogConfig, DialogParams} from "../../../types/types";

const template = `
	<button type="button" class="close" data-id="popup_close" title="Close">&times;</button>
	<div data-id="pretitle_area"></div>
	<span class="text_muted right" data-id="popup_comment"></span>
	<h2 class="trn" data-id="popup_title"></h2>
	<div class="dialog_content" data-id="dialog_content">
		<div data-id="preview_content"></div>
		<div data-id="params_content"></div>
	</div>
	<div class="buttons">
		<button type="button" data-id="popup_ok" class="button trn">Ok</button>
		<button type="button" data-id="popup_cancel" class="button trn">Cancel</button>
	</div>
`;

class Dialog_class {

	previousPOP: any = null;
	el: HTMLDivElement = null;
	eventHandles: any = [];
	active: boolean = false;
	title: string = "";
	onfinish: ((params: DialogParams[]) => void) | null = null;
	oncancel: ((params: DialogParams[]) => void) | null = null;
	preview: boolean = false;
	preview_padding: number = 0;
	onload: ((params: string) => void) | null = null;
	onchange: ((params: string) => void) | null = null;
	width_mini: number = 225;
	height_mini: number = 200;
	id: number = 0;
	parameters: DialogParams[] = [];
	Base_layers = new Base_layers_class();
	Base_gui = new Base_gui_class();
	Tools_translate = new Tools_translate_class();
	last_params_hash: string = "";
	layer_active_small: HTMLCanvasElement = document.createElement("canvas");
	layer_active_small_ctx: CanvasRenderingContext2D = this.layer_active_small.getContext("2d");
	caller: null = null;
	resize_clicked = {x: 0, y: 0};
	element_offset = {x: 0, y: 0};

	className: string = "";
	comment: string = "";

	constructor() {
		if (!window.POP) {
			window.POP = this;
		}

		this.previousPOP = null;
		this.el = null;
		this.eventHandles = [];
		this.active = false;
		this.title = "";
		this.onfinish = null;
		this.oncancel = null;
		this.preview = false;
		this.preview_padding = 0;
		this.onload = null;
		this.onchange = null;
		this.width_mini = 225;
		this.height_mini = 200;
		this.id = 0;
		this.parameters = [];
		this.last_params_hash = "";
		this.layer_active_small = document.createElement("canvas");
		this.layer_active_small_ctx = this.layer_active_small.getContext("2d");
		this.caller = null;
		this.resize_clicked = {x: 0, y: 0};
		this.element_offset = {x: 0, y: 0};
	}



	/**
	 * shows dialog
	 * 
	 * @param {array} config
	 */
	show(config: DialogConfig) {


    this.previousPOP = window.POP;
		window.POP = this;

		if (this.active == true) {
			this.hide();
		}

		this.title = config.title || "";
		this.parameters = config.params || [];
		this.onfinish = config.on_finish || null;
		this.oncancel = config.on_cancel || null;
		this.preview = config.preview || false;
		this.preview_padding = config.preview_padding || 0;
		this.onchange = config.on_change ?? null;
		this.onload = config.on_load || null;
		this.className = config.className || "";
		this.comment = config.comment || "";

		//reset position
		this.el = document.createElement("div");
    this.el.setAttribute("class", "popup");
    // this.el.classList = "popup";
		this.el.role = "dialog";
		document.querySelector("#popups")?.appendChild(this.el);
		this.el.style.top = "";
		this.el.style.left = "";

		this.show_action();
		this.set_events();
	}

	/**
	 * hides dialog
	 * 
	 * @param {boolean} success
	 * @returns {undefined}
	 */
	hide(success: boolean = true) {
		window.POP = this.previousPOP;
		const params = this.get_params();

		if (success === false && this.oncancel) {
			this.oncancel(params);
		}
		if (this.el && this.el.parentNode) {
			this.el.parentNode.removeChild(this.el);
		}
		this.parameters = [];
		this.active = false;
		this.preview = false;
		this.preview_padding = 0;
		this.onload = null;
		this.onchange = null;
		this.title = "";
		this.className = "";
		this.comment = "";
		this.onfinish = null;
		this.oncancel = null;

		this.remove_events();
	}

	get_active_instances() {
		const popups = document.getElementById("popups");
		if (popups !== null) {
			return popups.children.length;
		}
		return 0;
	}

	/* ----------------- private functions ---------------------------------- */

	addEventListener(target: Document | (Window & typeof globalThis), type: string, listener: { (event: any): void; (event: any): void; (event: any): void; (event: any): void; (event: any): void; }, options: boolean) {
		target.addEventListener(type, listener, options);
		const handle = {
			target, type, listener,
			remove() {
				target.removeEventListener(type, listener);
			}
		};
		this.eventHandles.push(handle);
	}

	set_events() {
		this.addEventListener(document, "keydown", (event: { code: any; }) => {
			const code = event.code;

			if (code == "Escape") {
				//escape
				this.hide(false);
			}
		}, false);

		//register events
		this.addEventListener(document, "mousedown", (event: { target: any; preventDefault: () => void; pageX: any; pageY: any; }) => {
			if(event.target != this.el.querySelector("h2"))
				return;
			event.preventDefault();
			this.resize_clicked.x = event.pageX;
			this.resize_clicked.y = event.pageY;

			const target = this.el;
			this.element_offset.x = target.offsetLeft;
			this.element_offset.y = target.offsetTop;
		}, false);

		this.addEventListener(document, "mousemove", (event: { pageX: number; pageY: number; }) => {
			if(this.resize_clicked.x != null){
				const dx = this.resize_clicked.x - event.pageX;
				const dy = this.resize_clicked.y - event.pageY;

				const target = this.el;
				target.style.left = `${this.element_offset.x - dx  }px`;
				target.style.top = `${this.element_offset.y - dy  }px`;
			}
		}, false);

		this.addEventListener(document, "mouseup", (event: { target: any; preventDefault: () => void; }) => {
			if(event.target != this.el.querySelector("h2"))
				return;
			event.preventDefault();
			this.resize_clicked.x = 0;
			this.resize_clicked.y = 0;
		}, false);

		this.addEventListener(window, "resize", (event: any) => {
			const target = this.el;
			target.style.top = "";
			target.style.left = "";
		}, false);
	}

	remove_events() {
		for (const handle of this.eventHandles) {
			handle.remove();
		}
		this.eventHandles = [];
	}

	onChangeEvent(e: any) {
		const params = this.get_params();

		const hash = JSON.stringify(params);
		if (this.last_params_hash == hash && this.onchange) {
			//nothing changed
			return;
		}
		this.last_params_hash = hash;

		if (!this.onchange) {
			if (this.preview != false) {
				const canvas_right = this.el.querySelector("[data-id=\"pop_post\"]") as HTMLCanvasElement;
				const ctx_right = canvas_right.getContext("2d") as CanvasRenderingContext2D;

				ctx_right.clearRect(0, 0, this.width_mini, this.height_mini);
				ctx_right.drawImage(this.layer_active_small,
					this.preview_padding, this.preview_padding,
					this.width_mini - this.preview_padding * 2, this.height_mini - this.preview_padding * 2
				);

				this.onchange(params, ctx_right, this.width_mini, this.height_mini, canvas_right);
			}
			else {
				this.onchange(params);
			}
		}
	}

	//renders preview. If input=range supported, is called on every param update - must be fast...
	preview_handler(e: undefined) {
		if (this.preview !== false) {
			this.onChangeEvent(e);
		}
	}

	//OK pressed - prepare data and call handlers
	save() {
		const params = this.get_params();

		if (this.onfinish) {
			this.onfinish(params);
		}

		this.hide(true);
	}
	
	//"Cancel" pressed
	cancel() {
		if (this.oncancel) {
			const params = this.get_params();
			this.oncancel(params);
		}
	}

	get_params() {
		const response = {};
		if(this.el == undefined){
			return null;
		}
		const inputs = this.el.querySelectorAll("input");
		for (let i = 0; i < inputs.length; i++) {
			if (inputs[i].id.substr(0, 9) == "pop_data_") {
				let key = inputs[i].id.substr(9);
				if (this.strpos(key, "_poptmp") != false)
					key = key.substring(0, this.strpos(key, "_poptmp"));
				const value = inputs[i].value;
				if (inputs[i].type == "radio") {
					if (inputs[i].checked == true)
						response[key] = value;
				}
				else if (inputs[i].type == "number") {
					response[key] = parseFloat(value);
				}
				else if (inputs[i].type == "checkbox") {
					if (inputs[i].checked == true)
						response[key] = true;
					else
						response[key] = false;
				}
				else if (inputs[i].type == "range") {
					response[key] = parseFloat(value);
				}
				else {
					response[key] = value;
				}

			}
		}
		const selects = this.el.querySelectorAll("select");
		for (let i = 0; i < selects.length; i++) {
			if (selects[i].id.substr(0, 9) == "pop_data_") {
				const key = selects[i].id.substr(9);
				response[key] = selects[i].value;
			}
		}
		const textareas = this.el.querySelectorAll("textarea");
		for (let i = 0; i < textareas.length; i++) {
			if (textareas[i].id.substr(0, 9) == "pop_data_") {
				const key = textareas[i].id.substr(9);
				response[key] = textareas[i].value;
			}
		}

		return response;
	}

	/**
	 * show popup window.
	 * used strings: "Ok", "Cancel", "Preview"
	 */
	show_action() {
		this.id = this.getRandomInt(0, 999999999);
		if (this.active == true) {
			this.hide();
			return false;
		}
		this.active = true;

		//build content
		const html_pretitle_area = "";
		let html_preview_content = "";
		let html_params = "";

		//preview area
		if (this.preview !== false) {
			html_preview_content += "<div class=\"preview_container\">";
			html_preview_content += `<canvas class="preview_canvas_left" width="${  this.width_mini  }" height="${
				 this.height_mini  }" data-id="pop_pre"></canvas>`;
			html_preview_content += "<div class=\"canvas_preview_container\">";
			html_preview_content += `	<canvas class="preview_canvas_post_back" width="${  this.width_mini
				 }" height="${  this.height_mini  }" data-id="pop_post_back"></canvas>`;
			html_preview_content += `	<canvas class="preview_canvas_post" width="${  this.width_mini  }" height="${
				 this.height_mini  }" data-id="pop_post"></canvas>`;
			html_preview_content += "</div>";
			html_preview_content += "</div>";
		}

		//generate params
		html_params += this.generateParamsHtml();

		this.el.innerHTML = template;
		this.el.querySelector("[data-id=\"pretitle_area\"]").innerHTML = html_pretitle_area;
		this.el.querySelector("[data-id=\"popup_title\"]").innerHTML = this.title;
		this.el.querySelector("[data-id=\"popup_comment\"]").innerHTML = this.comment;
		this.el.querySelector("[data-id=\"preview_content\"]").innerHTML = html_preview_content;
		this.el.querySelector("[data-id=\"params_content\"]").innerHTML = html_params;
		if (this.onfinish != false) {
			this.el.querySelector("[data-id=\"popup_cancel\"]").style.display = "";
		}
		else {
			this.el.querySelector("[data-id=\"popup_cancel\"]").style.display = "none";
		}

		this.el.style.display = "block";
		if (this.className) {
			this.el.classList.add(this.className);
		}

		//replace color inputs
		this.el.querySelectorAll("input[type=\"color\"]").forEach((colorInput: { getAttribute: (arg0: string) => any; removeAttribute: (arg0: string) => void; }) => {
			const id = colorInput.getAttribute("id");
			colorInput.removeAttribute("id");
			$(colorInput)
				.uiColorInput({ inputId: id })
				.on("change", (e: any) => {
					this.onChangeEvent(e);
				});
		});

		//events
		this.el.querySelector("[data-id=\"popup_ok\"]").addEventListener("click", (event: any) => {
			this.save();
		});
		this.el.querySelector("[data-id=\"popup_cancel\"]").addEventListener("click", (event: any) => {
			this.hide(false);
		});
		this.el.querySelector("[data-id=\"popup_close\"]").addEventListener("click", (event: any) => {
			this.hide(false);
		});
		const targets = this.el.querySelectorAll("input");
		for (let i = 0; i < targets.length; i++) {
			targets[i].addEventListener("keyup", (event: any) => {
				this.onkeyup(event);
			});
		}

		//onload
		if (this.onload) {
			const params = this.get_params();
			this.onload(params, this);
		}

		//load preview
		if (this.preview !== false) {
			//get canvas from layer
			const canvas = this.Base_layers.convert_layer_to_canvas();

			//draw original image
			const canvas_left = this.el.querySelector("[data-id=\"pop_pre\"]");
			const pop_pre = canvas_left.getContext("2d");
			pop_pre.clearRect(0, 0, this.width_mini, this.height_mini);
			pop_pre.rect(0, 0, this.width_mini, this.height_mini);
			pop_pre.fillStyle = "#ffffff";
			pop_pre.fill();
			this.draw_background(pop_pre, this.width_mini, this.height_mini, 10);

			pop_pre.scale(this.width_mini / canvas.width, this.height_mini / canvas.height);
			pop_pre.drawImage(canvas, 0, 0);
			pop_pre.scale(1, 1);

			//prepare temp canvas for faster repaint
			this.layer_active_small.width = POP.width_mini;
			this.layer_active_small.height = POP.height_mini;
			this.layer_active_small_ctx.scale(this.width_mini / canvas.width, this.height_mini / canvas.height);
			this.layer_active_small_ctx.drawImage(canvas, 0, 0);
			this.layer_active_small_ctx.scale(1, 1);

			//draw right background
			const canvas_right_back = this.el.querySelector("[data-id=\"pop_post_back\"]").getContext("2d");
			this.draw_background(canvas_right_back, this.width_mini, this.height_mini, 10);

			//copy to right side
			const canvas_right = this.el.querySelector("[data-id=\"pop_post\"]").getContext("2d");
			canvas_right.clearRect(0, 0, this.width_mini, this.height_mini);
			canvas_right.drawImage(canvas_left,
				this.preview_padding, this.preview_padding,
				this.width_mini - this.preview_padding * 2, this.height_mini - this.preview_padding * 2);

			//prepare temp canvas
			this.preview_handler();
		}

		//call translation again to translate popup
		const lang = this.Base_gui.get_language();
		this.Tools_translate.translate(lang);
	}

	generateParamsHtml() {
		let html = "<table>";
		const title = null;
		for (const i in this.parameters) {
			const parameter = this.parameters[i];

			html += `<tr id="popup-tr-${  this.parameters[i].name  }">`;
			if (title != "Error" && parameter.title != undefined)
				html += `<th class="trn">${  parameter.title  }</th>`;
			if (parameter.name != undefined) {
				if (parameter.values != undefined) {
					if (parameter.values.length > 10 || parameter.type == "select") {
						//drop down
						html += `<td colspan="2"><select onchange="POP.onChangeEvent();" id="pop_data_${  parameter.name
							 }">`;
						let k = 0;
						for (const j in parameter.values) {
							let sel = "";
							if (parameter.value == parameter.values[j])
								sel = "selected=\"selected\"";
							if (parameter.value == undefined && k == 0)
								sel = "selected=\"selected\"";
							html += `<option ${  sel  } name="${  parameter.values[j]  }">${  parameter.values[j]
								 }</option>`;
							k++;
						}
						html += "</select></td>";
					}
					else {
						//radio
						html += "<td class=\"radios\" colspan=\"2\">";
						if (parameter.values.length > 2)
							html += `<div class="group" id="popup-group-${  this.parameters[i].name  }">`;
						let k = 0;
						for (const j in parameter.values) {
							let ch = "";
							if (parameter.value == parameter.values[j])
								ch = "checked=\"checked\"";
							if (parameter.value == undefined && k == 0)
								ch = "checked=\"checked\"";

							let title = parameter.values[j];
							const parts = parameter.values[j].split(" - ");
							if (parts.length > 1) {
								title = `${parts[0]  } - <span class="trn">${  parts[1]  }</span>`;
							}

							html += `<input type="radio" onchange="POP.onChangeEvent();" ${  ch  } name="${
								 parameter.name  }" id="pop_data_${  parameter.name  }_poptmp${  j  }" value="${
								 parameter.values[j]  }">`;
							html += `<label class="trn" for="pop_data_${  parameter.name  }_poptmp${  j  }">${  title
								 }</label>`;
							if (parameter.values.length > 2)
								html += "<br />";
							k++;
						}
						if (parameter.values.length > 2)
							html += "</div>";
						html += "</td>";
					}
				}
				else if (parameter.value != undefined) {
					//input, range, textarea, color
					let step = 1;
					if (parameter.step != undefined)
						step = parameter.step;
					if (parameter.range != undefined) {
						//range
						html += `<td><input type="range" name="${  parameter.name  }" id="pop_data_${  parameter.name
							 }" value="${  parameter.value  }" min="${  parameter.range[0]  }" max="${
							 parameter.range[1]  }" step="${  step
							 }" oninput="document.getElementById('pv${  i  }').innerHTML = `
							+ "Math.round(this.value*100) / 100;POP.preview_handler();\" "
							+"onchange=\"POP.onChangeEvent();\" /></td>";
						html += `<td class="range_value" id="pv${  i  }">${  parameter.value  }</td>`;
					}
					else if (parameter.type == "color") {
						//color
						html += `<td><input type="color" id="pop_data_${  parameter.name  }" value="${  parameter.value
							 }" onchange="POP.onChangeEvent();" /></td>`;
					}
					else if (typeof parameter.value == "boolean") {
						let checked = "";
						if (parameter.value === true)
							checked = "checked";
						html += `<td class="checkbox"><input type="checkbox" id="pop_data_${  parameter.name  }" ${
							 checked  } onclick="POP.onChangeEvent();" > <label class="trn" for="pop_data_${
							 parameter.name  }">Toggle</label></td>`;
					}
					else {
						//input or textarea
						if (parameter.placeholder == undefined)
							parameter.placeholder = "";
						if (parameter.type == "textarea") {
							//textarea
							html += `<td><textarea rows="10" id="pop_data_${  parameter.name
								 }" onchange="POP.onChangeEvent();" placeholder="${  parameter.placeholder  }" ${  parameter.prevent_submission ? "data-prevent-submission=\"\"" : ""  }>${
								 parameter.value  }</textarea></td>`;
						}
						else {
							//text or number
							let input_type = "text";
							if (parameter.placeholder != "" && !isNaN(parameter.placeholder))
								input_type = "number";
							if (parameter.value != undefined && typeof parameter.value == "number")
								input_type = "number";

							let comment_html = "";
							if (typeof parameter.comment !== "undefined") {
								comment_html = `<span class="field_comment trn">${  parameter.comment  }</span>`;
							}

							html += `<td colspan="2"><input type="${  input_type  }" id="pop_data_${  parameter.name
								 }" onchange="POP.onChangeEvent();" value="${  parameter.value  }" placeholder="${
								 parameter.placeholder  }" ${  parameter.prevent_submission ? "data-prevent-submission=\"\"" : ""  } />${comment_html}</td>`;
						}
					}
				}
			}
			else if (parameter.function != undefined) {
				//custom function
				const result = parameter.function();
				html += `<td colspan="3">${  result  }</td>`;
			}
			else if (parameter.html != undefined) {
				//html
				html += `<td class="html_value" colspan="2">${  parameter.html  }</td>`;
			}
			else if (parameter.title == undefined) {
				//gap
				html += "<td colspan=\"2\"></td>";
			}
			else {
				//locked fields without name
				const str = `${  parameter.value}`;
				let id_tmp = parameter.title.toLowerCase().replace(/[^\w]+/g, "").replace(/ +/g, "-");
				id_tmp = id_tmp.substring(0, 10);
				if (str.length < 40)
					html += `<td colspan="2"><div class="trn" id="pop_data_${  id_tmp  }">${  parameter.value
						 }</div></td>`;
				else
					html += `<td class="long_text_value" colspan="2"><textarea disabled="disabled">${  parameter.value
						 }</textarea></td>`;
			}
			html += "</tr>";
		}
		html += "</table>";

		return html;
	}

	//on key press inside input text
	onkeyup(event: { key: string; target: { hasAttribute: (arg0: string) => any; }; preventDefault: () => void; }) {
		if (event.key == "Enter") {
			if (event.target.hasAttribute("data-prevent-submission")) {
				event.preventDefault();
			} else {
				this.save();
			}
		}
	}

	getRandomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	strpos(haystack: any, needle: string, offset: undefined) {
		const i = (`${haystack  }`).indexOf(needle, (offset || 0));
		return i === -1 ? false : i;
	}

	draw_background(canvas: { beginPath: () => void; rect: (arg0: number, arg1: number, arg2: any, arg3: any) => void; fillStyle: string; fill: () => void; fillRect: (arg0: number, arg1: number, arg2: any, arg3: any) => void; }, W: number, H: number, gap: number | undefined, force: undefined) {
		const transparent = this.Base_gui.get_transparency_support();

		if (transparent == false && force == undefined) {
			canvas.beginPath();
			canvas.rect(0, 0, W, H);
			canvas.fillStyle = "#ffffff";
			canvas.fill();
			return false;
		}
		if (gap == undefined)
			gap = 10;
		let fill = true;
		for (let i = 0; i < W; i = i + gap) {
			if (i % (gap * 2) == 0)
				fill = true;
			else
				fill = false;
			for (let j = 0; j < H; j = j + gap) {
				if (fill == true) {
					canvas.fillStyle = "#eeeeee";
					canvas.fillRect(i, j, gap, gap);
					fill = false;
				}
				else
					fill = true;
			}
		}
	}

}

export default Dialog_class;