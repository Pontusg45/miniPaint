
export class Base_action {
	private is_done: boolean;
	action_id: string;
	private action_description: string;
	memory_estimate: number;
	database_estimate: number;
	constructor(action_id: string, action_description: string) {
		this.action_id = action_id;
		this.action_description = action_description;
		this.is_done = false;
		this.memory_estimate = 0; // Estimate of how much memory will be freed when the free() method is called (in bytes)
		this.database_estimate = 0; // Estimate of how much database space will be freed when the free() method is called (in bytes)
	}
	do() {
		this.is_done = true;
	}
	undo() {
		this.is_done = false;
	}
	free() {
		// Override if need to run tasks to free memory when action is discarded from history
	}
}