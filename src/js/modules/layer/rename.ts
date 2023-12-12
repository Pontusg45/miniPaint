// @ts-nocheck
import { DialogConfig } from "../../../../types/types";
import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Dialog_class from "../../libs/popup";

class Layer_rename_class {
	Base_layers: Base_layers_class;
	POP: Dialog_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
	}

	rename(id = "") {

		const settings = {
			title: "Rename",
			params: [
				{name: "name", title: "Name:", value: config.layer.name},
			],
			on_load: function () {
				document.querySelector("#pop_data_name")?.select();
			},
			on_finish: function (params: { name: any; }) {
				app.State?.do_action(
					new app.Actions.Bundle_action("rename_layer", "Rename Layer", [
						new app.Actions.Refresh_layers_gui_action("undo"),
						new app.Actions.Update_layer_action(id || config.layer.id, {
							name: params.name
						}),
						new app.Actions.Refresh_layers_gui_action("do")
					])
				);
			},
		};
		this.POP.show(settings as DialogConfig);
	}
}

export default Layer_rename_class;
