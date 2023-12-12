import app from "../app";
import config from "../config";
import { Base_action } from "./base";
import Tools_settings_class from "../modules/tools/settings";

export class Autoresize_canvas_action extends Base_action {
	private Tools_settings: Tools_settings_class;
	private width = 0;
	private height = 0;
	private layer_id = 0;
	private can_automate: boolean;
	private ignore_same_size: boolean;
	private old_config_width = 0;
	private old_config_height = 0;
	/**
	 * autoresize canvas to layer size, based on dimensions, up - always, if 1 layer - down.
	 *
	 * @param {int} width
	 * @param {int} height
	 * @param {int} layer_id
	 * @param {boolean} can_automate
	 */
	constructor(width = 0, height = 0, layer_id = 0, can_automate: boolean = true, ignore_same_size = false) {
		super("autoresize_canvas", "Auto-resize Canvas");
		this.Tools_settings = new Tools_settings_class();
		this.width = width;
		this.height = height;
		this.layer_id = layer_id;
		this.can_automate = can_automate;
		this.ignore_same_size = ignore_same_size;
		this.old_config_width = 0;
		this.old_config_height = 0;
	}

	async do() {
		super.do();
		const width = this.width;
		const height = this.height;
		const can_automate = this.can_automate;
		let need_fit = false;
		let new_config_width = config.WIDTH;
		let new_config_height = config.HEIGHT;
		const enable_autoresize = this.Tools_settings.get_setting("enable_autoresize");

		if (enable_autoresize == null) {
			return;
		}

		// Resize up
		if (width > new_config_width || height > new_config_height) {
			const wrapper = document.getElementById("main_wrapper");
			const page_w = wrapper?.clientWidth ?? 0;
			const page_h = wrapper?.clientHeight ?? 0;

			if (width > page_w || height > page_h) {
				need_fit = true;
			}
			if (width > new_config_width)
				new_config_width = width;
			if (height > new_config_height)
				new_config_height = height;
		}

		// Resize down
		if (config.layers.length === 1 && can_automate !== false) {
			if (width < new_config_width)
				new_config_width = width;
			if (height < new_config_height)
				new_config_height = height;
		}

		if (new_config_width !== config.WIDTH || new_config_height !== height) {
			this.old_config_width = config.WIDTH;
			this.old_config_height = config.HEIGHT;
			config.WIDTH = new_config_width;
			config.HEIGHT = new_config_height;
			app.GUI?.prepare_canvas();
		} else if (!this.ignore_same_size) {
			throw new Error("Aborted - Resize not necessary");
		}

		// Fit zoom when after short pause
		// @todo - remove setTimeout
		if (need_fit) {
			await new Promise<void>((resolve) => {
				window.setTimeout(() => {
					app.GUI?.GUI_preview?.zoom_auto();
					resolve();
				}, 100);
			});
		}
	}

	async undo() {
		super.undo();
		if (this.old_config_width != null) {
			config.WIDTH = this.old_config_width;
		}
		if (this.old_config_height != null) {
			config.HEIGHT = this.old_config_height;
		}
		if (this.old_config_width != null || this.old_config_height != null) {
			app.GUI?.prepare_canvas();
		}
	}
}