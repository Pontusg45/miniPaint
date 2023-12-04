import { ConfigType } from "./config";
import Base_gui_class from "./core/base-gui";
import Base_layers_class from "./core/base-layers";
import Base_state_class from "./core/base-state";
import Base_tools_class from "./core/base-tools";
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
  Update_layer_image_action, Update_layer_action,
} from "./actions/index.js";

// Store singletons for easy access
export default {
	GUI: null as null | Base_gui_class,
	Tools: null as null | Base_tools_class,
	Layers: null as null | Base_layers_class,
	Config: null as null | ConfigType,
	State: null as null | Base_state_class,
	FileOpen: null as null | File_open_class,
	FileSave: null as null | File_save_class,
	Actions: {
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
  },
};
