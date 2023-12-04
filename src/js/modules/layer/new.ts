import app from "../../app.js";
import config from "../../config.js";
import Base_layers_class from "../../core/base-layers.js";
import GUI_tools_class from "../../core/gui/gui-tools.js";
import Base_selection_class from "../../core/base-selection.js";
import Selection_class from "../../tools/selection.js";
import Helper_class from "../../libs/helpers.js";

class Layer_new_class {
	Base_layers: Base_layers_class;
	Selection: Selection_class;
	Base_selection: Base_selection_class;
	GUI_tools: GUI_tools_class;
	Helper: Helper_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.Selection = new Selection_class();
		this.Base_selection = new Base_selection_class(this.Base_layers.ctx);
		this.GUI_tools = new GUI_tools_class();
		this.Helper = new Helper_class();

		this.set_events();
	}

	set_events() {
		document.addEventListener("keydown", (event) => {
			let code = event.keyCode;
			if (this.Helper.is_input(event.target))
				return;

			if (code == 78 && event.ctrlKey != true && event.metaKey != true) {
				//N
				this.new();
			}
		}, false);
	}

	new() {
		app.State?.do_action(
			new app.Actions.Insert_layer_action()
		);
	}

	new_selection() {
		let selection = this.Base_selection.get_selection();
		let layer = config.layer;

		if (selection.width === null || config.layer.type != "image") {
			alert("Empty selection or type not image.");
			return;
		}
		if (config.TOOL.name != "selection") {
			alert("Empty selection or type not image.");
			return;
		}

		//if image was stretched
		let width_ratio = (layer.width / layer.width_original);
		let height_ratio = (layer.height / layer.height_original);
		
		let left = selection.x - layer.x;
		let top = selection.y - layer.y;
		
		//adapt to origin size
		selection.width = selection.width / width_ratio;
		selection.height = selection.height / height_ratio;
		
		//create new layer
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d");
		canvas.width = Math.round(selection.width);
		canvas.height = Math.round(selection.height);
		
		ctx.translate(-left / width_ratio, -top / height_ratio);
		ctx.drawImage(config.layer.link, 0, 0);
		ctx.translate(0, 0);

		//register it
		let params = {
			x: Math.round(selection.x),
			y: Math.round(selection.y),
			width: Math.round(selection.width * width_ratio),
			height: Math.round(selection.height * height_ratio),
			width_original: Math.round(selection.width),
			height_original: Math.round(selection.height),
			type: "image",
			data: canvas.toDataURL("image/png"),
		};
		app.State?.do_action(
			new app.Actions.Bundle_action("new_layer", "New Layer", [
				new app.Actions.Insert_layer_action(params, false),
				...this.Selection.on_leave(),
				new app.Actions.Activate_tool_action("select")
			])
		);
	}

}

export default Layer_new_class;