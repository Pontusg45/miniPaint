import app from "../app";
import config from "../config";
import { Base_action } from "./base";

export class Activate_tool_action extends Base_action {
  private key: string;
  private ignore_same_tool: boolean;
  private tool_leave_actions: Base_action[] | null;
  private old_key: string | undefined;
  private tool_activate_actions: Base_action[] | null;
	/**
	 * Groups multiple actions together in the undo/redo history, runs them all at once.
	 */
	constructor(key = "", ignore_same_tool = false) {
		super("activate_tool", "Activate Tool");
		this.ignore_same_tool = !!ignore_same_tool;
		this.key = key;
		this.old_key = "";
		this.tool_leave_actions = [];
		this.tool_activate_actions = [];
	}

	async do() {
		let moduleKey;
    super.do();
		const key = this.key;
		this.old_key = app.GUI?.GUI_tools?.active_tool;

		if (this.key !== this.old_key || this.ignore_same_tool) {

			//reset last
			document.querySelector(`#tools_container .${  this.old_key}`)?.classList.remove("active");

			//send exit event to old previous tool
			if (config.TOOL.on_leave != undefined) {
				moduleKey = config.TOOL.name;
				const functionName = config.TOOL.on_leave;
				// @ts-ignore
				this.tool_leave_actions = app.GUI?.GUI_tools?.tools_modules?[moduleKey].object[functionName]: () => {};
				
				if (this.tool_leave_actions) {
					for (const action of this.tool_leave_actions) {
						action.do();
					}
				}
			}

			//change active
			if (app.GUI?.GUI_tools?.active_tool) {
				app.GUI.GUI_tools.active_tool = key;
			}
			document.querySelector(`#tools_container .${app.GUI?.GUI_tools?.active_tool}`)?.classList.add("active");
			for (const tool of config.TOOLS) {
				if (tool.name == app.GUI?.GUI_tools?.active_tool) {
					config.TOOL = tool;
				}
			}

			//check module

			if (app.GUI?.GUI_tools?.tools_modules && app.GUI?.GUI_tools.tools_modules[key] === undefined) {
				alert(`Tools class not found: ${key}`);
				return;
			}

			//set default cursor
			const mainWrapper = document.getElementById("main_wrapper");
			const defaultCursor = config.TOOL && config.TOOL.name === "text" ? "text" : "default";
			if (mainWrapper?.style.cursor && mainWrapper?.style.cursor !== defaultCursor) {
				mainWrapper.style.cursor = defaultCursor;
			}

			app.GUI?.GUI_tools?.show_action_attributes();
			if (app.GUI?.GUI_tools?.Helper)
				app.GUI.GUI_tools.Helper.setCookie("active_tool", app.GUI?.GUI_tools?.active_tool || "");
		}

		//send activate event to new tool
		if (config.TOOL.on_activate != undefined) {
      moduleKey = config.TOOL.name;
      const functionName = config.TOOL.on_activate;
			// @ts-ignore
			this.tool_activate_actions = app.GUI?.GUI_tools?.tools_modules[moduleKey].object[functionName];
			if (this.tool_activate_actions) {
				for (let action of this.tool_activate_actions) {
					await action.do();
				}
			}
		}

		config.need_render = true;
	}

	async undo() {
		super.undo();

		// Undo activate actions
		if (this.tool_activate_actions) {
			for (let action of this.tool_activate_actions) {
				await action.undo();
				action.free();
			}
			this.tool_activate_actions = null;
		}

		//reset last
		document.querySelector(`#tools_container .${  this.key}`)?.classList.remove("active");

		//change active
		if(app.GUI?.GUI_tools?.active_tool) {

			app.GUI.GUI_tools.active_tool = this.old_key;
		}
		document.querySelector(`#tools_container .${  app.GUI?.GUI_tools?.active_tool}`)?.classList.add("active");
		for (let i in config.TOOLS) {
			if (config.TOOLS[i].name == app.GUI?.GUI_tools?.active_tool) {
				config.TOOL = config.TOOLS[i];
			}
		}

		app.GUI?.GUI_tools?.show_action_attributes();
		app.GUI?.GUI_tools?.Helper?.setCookie("active_tool", app.GUI?.GUI_tools?.active_tool ?? "");

		//set default cursor
		const mainWrapper = document.getElementById("main_wrapper");
		const defaultCursor = config.TOOL && config.TOOL.name === "text" ? "text" : "default";
		if (mainWrapper && mainWrapper.style.cursor != defaultCursor) {
			mainWrapper.style.cursor = defaultCursor;
		}

		// Undo leave actions
		if (this.tool_leave_actions) {
			for (let action of this.tool_leave_actions) {
				await action.undo();
				action.free();
			}
			this.tool_leave_actions = null;
		}

		config.need_render = true;
	}

	free() {
		if (this.tool_activate_actions) {
			for (let action of this.tool_activate_actions) {
				action.free();
			}
			this.tool_activate_actions = null;
		}
		if (this.tool_leave_actions) {
			for (let action of this.tool_leave_actions) {
				action.free();
			}
			this.tool_leave_actions = null;
		}
	}
}