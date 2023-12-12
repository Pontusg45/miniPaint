import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import File_open_class from "./open";

/** 
 * manages files / quick-load
 * 
 * @author ViliusL
 */
class File_quickload_class {
	Base_layers: Base_layers_class;
	File_open: File_open_class;

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.File_open = new File_open_class();

		this.set_events();
	}

	set_events() {
		let _this = this;

		document.addEventListener("keydown", function (event) {
			const code = event.keyCode;

			if (code === 121) {
				//F10
				_this.quickload();
				event.preventDefault();
			}
		}, false);
	}

	quickload() {
		//load image data
		const json = localStorage.getItem("quicksave_data");
		if (json === "" || json == null) {
			//nothing was found
			return false;
		}

		this.File_open.load_json(json);
		return true;
	}

}

export default File_quickload_class;
