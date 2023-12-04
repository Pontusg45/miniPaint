/**
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

//css
import "./../css/reset.css";
import "./../css/utility.css";
import "./../css/component.css";
import "./../css/layout.css";
import "./../css/menu.css";
import "./../css/print.css";
import "./../../node_modules/alertifyjs/build/css/alertify.min.css";
//js
import app from "./app";
import config from "./config";
import "./core/components/index.js";
import Base_gui_class from "./core/base-gui.js";
import Base_layers_class from "./core/base-layers.js";
import Base_tools_class from "./core/base-tools";
import Base_state_class from "./core/base-state";
import File_open_class from "./modules/file/open";
import File_save_class from "./modules/file/save";
import {
  Activate_tool_action,
  Add_layer_filter_action,
  Autoresize_canvas_action,
  Bundle_action,
  Clear_layer_action,
  Delete_layer_action,
  Delete_layer_filter_action,
  Delete_layer_settings_action,
  Init_canvas_zoom_action,
  Insert_layer_action,
  Prepare_canvas_action,
  Reorder_layer_action,
  Reset_layers_action,
  Refresh_action_attributes_action,
  Refresh_layers_gui_action,
  Reset_selection_action,
  Select_layer_action,
  Select_next_layer_action,
  Select_previous_layer_action,
  Set_object_property_action,
  Set_selection_action,
  Stop_animation_action,
  Toggle_layer_visibility_action,
  Update_config_action,
  Update_layer_image_action,
  Update_layer_action
} from "./actions/index.js";



window.addEventListener("load", function () {
	// Initiate app
	const Layers = new Base_layers_class();
	const Base_tools = new Base_tools_class(true);
	const GUI = new Base_gui_class();
	const Base_state = new Base_state_class();
	const File_open = new File_open_class();
	const File_save = new File_save_class();
	// const Base_search = new Base_search_class();

	// Register singletons in app module
	//if (Actions !== null) {
		app.Actions = {
      Activate_tool_action,
      Add_layer_filter_action,
      Autoresize_canvas_action,
      Bundle_action,
      Clear_layer_action,
      Delete_layer_action,
      Delete_layer_filter_action,
      Delete_layer_settings_action,
      Init_canvas_zoom_action,
      Insert_layer_action,
      Prepare_canvas_action,
      Reorder_layer_action,
      Reset_layers_action,
      Refresh_action_attributes_action,
      Refresh_layers_gui_action,
      Reset_selection_action,
      Select_layer_action,
      Select_next_layer_action,
      Select_previous_layer_action,
      Set_object_property_action,
      Set_selection_action,
      Stop_animation_action,
      Toggle_layer_visibility_action,
      Update_config_action,
      Update_layer_image_action,
      Update_layer_action
    };

	// app.Actions = Actions;

	if (config !== null) {
		app.Config = config;
	}
	app.FileOpen = File_open;
	app.FileSave = File_save;

	if(GUI !== null) {
		app.GUI = GUI;
	}
	app.Layers = Layers;
	app.State = Base_state;
	app.Tools = Base_tools;

	// Register as global for quick or external access

	window.Layers = Layers;

	window.AppConfig = config;

	window.State = Base_state;

	window.FileOpen = File_open;

	window.FileSave = File_save;

	// Render all
	GUI.init();
	Layers.init();
}, false);
