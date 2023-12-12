import config from "../../config";
import Helper_class from "../../libs/helpers";
import Base_gui_class from "../../core/base-gui";

let instance: View_grid_class | null = null;

class View_grid_class {
	GUI: Base_gui_class = new Base_gui_class;
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
			if (this.Helper.is_input(event.target as HTMLInputElement))
				return;

			if (code == 71 && event.ctrlKey != true && event.metaKey != true) {
				//G - grid
				this.grid();
				event.preventDefault();
			}
		}, false);
	}

	grid() {
		if (this.GUI.grid == false) {
			this.GUI.grid = true;
		}
		else {
			this.GUI.grid = false;
		}
		config.need_render = true;
	}

}

export default View_grid_class;