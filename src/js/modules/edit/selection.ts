import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Selection_class from "../../tools/selection";

class Edit_selection_class {

	Selection: Selection_class;
	Base_layers: Base_layers_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.Selection = new Selection_class(this.Base_layers.ctx);
	}

	select_all() {
		if (config.layer.type != "image") {
			alert("This layer must contain an image. Please convert it to raster to apply this tool.");
			return;
		}
		this.Selection.select_all();
	}

	delete() {
		this.Selection.delete_selection();
	}
}

export default Edit_selection_class;
