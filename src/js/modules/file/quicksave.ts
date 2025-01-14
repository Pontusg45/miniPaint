import config from "../../config";
import File_save_class from "./save";
import Dialog_class from "../../libs/popup";

/** 
 * manages files / quick-save
 * 
 * @author ViliusL
 */
class File_quicksave_class {
	POP: Dialog_class;
	File_save: File_save_class;

	constructor() {
		this.POP = new Dialog_class();
		this.File_save = new File_save_class();

		this.set_events();
	}

	set_events() {
		let _this = this;

		document.addEventListener("keydown", function (event) {
			let code = event.keyCode;

			if (code == 120) {
				//F9
				_this.quicksave();
			}
		}, false);
	}

	quicksave() {
		//save image data
		let data_json = this.File_save.export_as_json();
		if (data_json.length > 5000000) {
			alert("Sorry, image is too big, max 5 MB.");
			return false;
		}
		localStorage.setItem("quicksave_data", data_json);
	}

}

export default File_quicksave_class;