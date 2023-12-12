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

export type ImageFiltersType = {
	utils: {
		initSampleCanvas: () => void;
		getSampleCanvas: () => HTMLCanvasElement;
		getSampleContext: () => CanvasRenderingContext2D;
		createImageData: (w: number, h: number) => ImageData;
		clamp: (value: number) => number;
		buildMap: (f: (arg0: number) => any) => any[];
		applyMap: (src: string | any[], dst: any[], map: { [x: string]: any; }) => void;
		mapRGB: (src: any, dst: any, func: any) => void;
		getPixelIndex: (x: number, y: number, width: number, height: number, edge: any) => number | null;
		getPixel: (src: Uint8ClampedArray, x: number, y: number, width: number, height: number, edge: any) => number;
		getPixelByIndex: (src: { [x: string]: number; }, i: number) => number;
		copyBilinear: (src: Uint8ClampedArray, x: number, y: number, width: number, height: number, dst: Uint8ClampedArray, dstIndex: number, edge: any) => void;
		rgbToHsl: (r: number, g: number, b: number) => number[];
		hslToRgb: (h: number, s: number, l: number) => number[];
	};

	Translate?: (srcImageData: any, x: number, y: number, interpolation: any) => void;
	Scale?: (srcImageData: any, scaleX: any, scaleY: any, interpolation: any) => void;
	Rotate?: (srcImageData: any, originX: any, originY: any, angle: any, resize: any, interpolation: any) => void;
	Affine?: (srcImageData: any, matrix: number, resize: any, interpolation: any) => void;
	UnsharpMask?: (srcImageData: any, level: any) => void;
	ConvolutionFilter: (srcImageData: ImageData, matrixX: number, matrixY: number, matrix: number[], divisor?: number, bias?: number, preserveAlpha?: boolean, clamp?: boolean, color?: number, alpha?: number) => ImageData;
	Binarize: (srcImageData: ImageData, threshold: number) => ImageData;
	BlendAdd: (srcImageData: ImageData, blendImageData: ImageData, dx: number, dy: number) => ImageData;
	BlendSubtract: (srcImageData: ImageData, blendImageData: ImageData, dx: number, dy: number) => ImageData;
	BoxBlur: (src: number[], dst: number[], width: number, height: number, radius: number) => ImageData;
	GaussianBlur: (src: number[], dst: number[], width: number, height: number, radius: number) => void;
	StackBlur: (src: number[], dst: number[], width: number, height: number, radius: number) => void;
	Brightness: (srcImageData: ImageData, brightness: number) => ImageData;
	BrightnessContrastGimp: (srcImageData: ImageData, brightness: number, contrast: number) => ImageData;
	BrightnessContrastPhotoshop: (srcImageData: ImageData, brightness: number, contrast: number) => ImageData;
	Channels: (srcImageData: ImageData, channel: number, value: number) => ImageData;
	Clone: (srcImageData: ImageData) => ImageData;
	CloneBuiltin: (srcImageData: ImageData) => ImageData;
	ColorMatrixFilter: (srcImageData: ImageData, matrix: number[]) => ImageData;
	ColorTransformFilter: (srcImageData: ImageData, redMultiplier: number, greenMultiplier: number, blueMultiplier: number, alphaMultiplier: number, redOffset: number, greenOffset: number, blueOffset: number, alphaOffset: number) => ImageData;
	Copy: (srcImageData: ImageData, dstImageData: ImageData) => ImageData;
	Crop: (srcImageData: ImageData, x: number, y: number, width: number, height: number) => ImageData;
	CropBuiltin: (srcImageData: ImageData, x: number, y: number, width: number, height: number) => ImageData;
	Desaturate: (srcImageData: ImageData) => ImageData;
	DisplacementMapFilter: (srcImageData: ImageData, mapImageData: ImageData, mapX: number, mapY: number, componentX: number, componentY: number, scaleX: number, scaleY: number, mode: number) => ImageData;
	Dither: (srcImageData: ImageData, levels: number) => ImageData;
	Edge: (srcImageData: ImageData) => ImageData;
	Emboss: (srcImageData: ImageData) => ImageData;
	Enrich: (srcImageData: ImageData) => ImageData;
	Flip: (srcImageData: ImageData, mode: number) => ImageData;
	Gamma: (srcImageData: ImageData, gamma: number) => ImageData;
	GrayScale: (srcImageData: ImageData) => ImageData;
	HSLAdjustment: (srcImageData: ImageData, hue: number, saturation: number, lightness: number) => ImageData;
	Invert: (srcImageData: ImageData) => ImageData;
	Mosaic: (srcImageData: ImageData, blockSize: number) => ImageData;
	Oil: (srcImageData: ImageData, range: number, levels: number) => ImageData;
	OpacityFilter: (srcImageData: ImageData, opacity: number) => ImageData;
	Posterize: (srcImageData: ImageData, levels: number) => ImageData;
	Rescale: (srcImageData: ImageData, scale: number) => ImageData;
	ResizeNearestNeighbor: (srcImageData: ImageData, width: number, height: number) => ImageData;
	Resize: (srcImageData: ImageData, width: number, height: number, interpolation: any) => ImageData;
	ResizeBuiltin: (srcImageData: ImageData, width: number, height: number, interpolation: any) => ImageData;
	Sepia: (srcImageData: ImageData) => ImageData;
	Sharpen: (srcImageData: ImageData, factor: number) => ImageData;
	Solarize: (srcImageData: ImageData) => ImageData;
	Transpose: (srcImageData: ImageData) => ImageData;
	Twril: (srcImageData: ImageData, centerX: number, centerY: number, radius: number, angle: number, edge: any, smooth: any) => ImageData;

}

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
  link?: HTMLImageElement | HTMLCanvasElement;
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
  square: boolean;
  text: Params;
  family: any;
  bold: any;
  italic: any;
  stroke: any;
  stroke_size: any;
  kerning: string;
  halign: any;
  align: any;
  valign: string;
  text_direction: string;
  wrap_direction: string;
  wrap: string;
  underline: any;
  strikethrough: any;
  leading: number;
  boundary: string;
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