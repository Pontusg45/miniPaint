import Dialog_class from "../src/js/libs/popup";
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
  Refresh_action_attributes_action,
  Refresh_layers_gui_action,
  Reorder_layer_action,
  Reset_layers_action,
  Reset_selection_action,
  Select_layer_action,
  Select_next_layer_action,
  Select_previous_layer_action,
  Set_object_property_action,
  Set_selection_action,
  Stop_animation_action,
  Toggle_layer_visibility_action, Update_config_action, Update_layer_action, Update_layer_image_action
} from "../src/js/actions";
import Base_layers_class from "../src/js/core/base-layers";
import config from "../src/js/config";
import Base_state_class from "../src/js/core/base-state";
import File_open_class from "../src/js/modules/file/open";
import File_save_class from "../src/js/modules/file/save";

export type DialogConfig = {
  title: string;
  params: DialogParams[];
  level?: number;
  on_finish?: (params: DialogParams[]) => void;
  on_cancel?: (params: DialogParams[]) => void;
  preview?: boolean;
  preview_padding?: number;
  on_change?: (params: { zoom: any; center: any; }) => void;
  on_load?: (params: { zoom: any; center: any; }, popup: Dialog_class) => void;
  className?: string;
  comment?: string;
}

export type DialogParams = {
  title: string;
  name?: string;
  html?: string;
  value?: number | string | boolean;
  range?: number[];
}
declare global {
  
  export interface Window {
    Layers: Base_layers_class,
    AppConfig: typeof config,
    State: Base_state_class,
    FileOpen: File_open_class,
    FileSave: File_save_class,
  }
}

export type Settings = {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  composition: string;
  rotate: number;
  data?: {
    start: {
      x: number;
      y: number;
    }
    end: {
      x: number;
      y: number;
    }
    x: number;
    y: number;
    width: number;
    height: number;
    cp1: {
      x: number;
      y: number;
    },
    cp2: {
      x: number;
      y: number;
    },
    cloneNode?: (flag: boolean) => HTMLImageElement;
  } | null | HTMLImageElement;
  params: Params;
  status: string | undefined;
  render_function: null | undefined | [Function, any[]] | string[];
  type: string;
  link?: HTMLImageElement;
};

export type Layer = Settings & {
  id: number;
  parent_id: number;
  name: string;
  is_vector: boolean;
  hide_selection_if_active: boolean;
  order: number;
  color: string;
  filters: any[];
  width_original: number;
  height_original: number;
  link_canvas?: HTMLCanvasElement;
}


export type Params =  {
  font: { value: string; };
  size: number;
  rotate: number;
  opacity: number;
  color: string;
  border: boolean;
  border_size: number;
  border_color: string;
  fill: boolean;
  fill_color: string;
  shadow: { value: boolean; };
  shadow_color: { value: string; };
  shadow_blur: { value: number; };
  shadow_offset_x: { value: number; };
  shadow_offset_y: { value: number; };
  blur: number;
  radius: number;
  sizes: { value: number; };
  circle: boolean;
  stroke_color: string;
  corners: number;
  inner_radius: number;
  x: number;
  y: number;
  strength: number;
  global: boolean;

};

export type Actions = (
  Activate_tool_action |
  Add_layer_filter_action |
  Autoresize_canvas_action |
  Bundle_action |
  Clear_layer_action |
  Delete_layer_action |
  Delete_layer_filter_action |
  Delete_layer_settings_action |
  Init_canvas_zoom_action |
  Insert_layer_action |
  Prepare_canvas_action |
  Reorder_layer_action |
  Reset_layers_action |
  Refresh_action_attributes_action |
  Refresh_layers_gui_action |
  Reset_selection_action |
  Select_layer_action |
  Select_next_layer_action |
  Select_previous_layer_action |
  Set_object_property_action |
  Set_selection_action |
  Stop_animation_action |
  Toggle_layer_visibility_action |
  Update_config_action |
  Update_layer_image_action |
  Update_layer_action
  )