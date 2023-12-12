import Base_state_class from "../../core/base-state";

class Edit_redo_class {
	Base_state = new Base_state_class();

	redo() {
		this.Base_state.redo();
	}
}

export default Edit_redo_class;
