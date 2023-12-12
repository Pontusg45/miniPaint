import app from "../app";
import config from "../config";
import zoomView from "../libs/zoomView";
import { Base_action } from "./base";

export class Init_canvas_zoom_action extends Base_action {
	old_bounds: { top: number; left: number; right: number; bottom: number; } | null | undefined;
	old_context: null | CanvasRenderingContext2D;
	old_stable_dimensions: number[] | undefined | null;
	/**
	 * Resets the canvas
	 */
	constructor() {
		super("init_canvas_zoom", "Initialize Canvas Zoom");
		this.old_context = null;
		this.old_stable_dimensions = undefined;
	}

	async do() {
		super.do();
		this.old_bounds = zoomView.getBounds();
		this.old_context = zoomView.getContext();
		this.old_stable_dimensions = app.Layers?.stable_dimensions;
		zoomView.setBounds(0, 0, config.WIDTH, config.HEIGHT);
		if (app.Layers !== null && app.Layers.ctx !== undefined) {
			zoomView.setContext(app.Layers.ctx);
			app.Layers.stable_dimensions = [
				config.WIDTH,
				config.HEIGHT
			];
		}
	}

	async undo() {
		super.undo();
		if(!this.old_bounds || !this.old_context || !this.old_stable_dimensions || app.Layers === null) {
			throw new Error("Aborted - no old bounds, context, or stable dimensions, or no layers");
		}
		zoomView.setBounds(this.old_bounds.top, this.old_bounds.left, this.old_bounds.right, this.old_bounds.bottom);
		zoomView.setContext(this.old_context);
		app.Layers.stable_dimensions = this.old_stable_dimensions;
		this.old_bounds = null;
		this.old_context = null;
		this.old_stable_dimensions = null;
	}

	free() {
		this.old_bounds = null;
		this.old_context = null;
		this.old_stable_dimensions = null;
	}
}