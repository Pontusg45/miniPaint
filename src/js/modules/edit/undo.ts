import Base_state_class from "../../core/base-state";

let instance: Edit_undo_class | null = null;

class Edit_undo_class {
	Base_state = new Base_state_class();

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_state = new Base_state_class();
		this.events();
	}

	events() {

		document.querySelector("#undo_button")?.addEventListener("click", (event) => {
			this.Base_state.undo();
		});
	}

	undo() {
		this.Base_state.undo();
	}
}

export default Edit_undo_class;
