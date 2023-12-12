/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import app from "../app";
import config from "../config";
import Base_gui_class from "./base-gui";
import Base_selection_class from "./base-selection";
import Image_trim_class from "../modules/image/trim";
import View_ruler_class from "../modules/view/ruler";
import zoomView from "../libs/zoomView";
import Helper_class from "../libs/helpers";
import { Layer } from "../../../types/types";

let instance: Base_layers_class | null = null;

/**
 * Layers class - manages layers. Each layer is object with various types. Keys:
 * - id (int)
 * - link (image)
 * - parent_id (int)
 * - name (string)
 * - type (string)
 * - x (int)
 * - y (int)
 * - width (int)
 * - height (int)
 * - width_original (int)
 * - height_original (int)
 * - visible (bool)
 * - is_vector (bool)
 * - hide_selection_if_active (bool)
 * - opacity (0-100)
 * - order (int)
 * - composition (string)
 * - rotate (int) 0-359
 * - data (various data here)
 * - params (object)
 * - color {hex}
 * - status (string)
 * - filters (array)
 * - render_function (function)
 */
class Base_layers_class {
	color = "";
	render_function: null | undefined;
	status: null | undefined;
	visible: boolean | undefined;
	_exif: {
    general: string[]
  } | undefined;
	is_vector: boolean | undefined;
	free() {
		throw new Error("Method not implemented.");
	}
	action_id(action_id: any) {
		throw new Error("Method not implemented.");
	}
	do() {
		throw new Error("Method not implemented.");
	}
	undo() {
		throw new Error("Method not implemented.");
	}

  Base_gui = new Base_gui_class();
  Helper = new Helper_class();
  Image_trim = new Image_trim_class();
  View_ruler = new View_ruler_class();

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | undefined;
  ctx_preview: CanvasRenderingContext2D | null = null;
  last_zoom = 1;
  auto_increment = 1;
  stable_dimensions: number[] = [];
  debug_rendering = false;
  render_success: boolean | null | undefined;
  disabled_filter_id: number | null = null;
  Base_selection: Base_selection_class | undefined;


  id!: number;
  opacity = 100;
  composition: string | undefined;
  type: boolean | undefined | string;
  order: number | undefined;
  _needs_update_data: boolean | undefined;
  link: {
    [key: string]: any;
  } | undefined;
  filters: {
    name: string;
    id: number;
    params: any;
  }[] | undefined;
  _link_database_id: string | undefined;
  width = 0;
  height = 0;
  data: number | undefined;
  width_original: number | undefined;
	x = 0;
	y = 0;
	params: any;
	rotate: number | undefined;
	name: string | undefined;
	height_original: any;
	link_canvas: any;
	action_description: string | undefined;
	memory_estimate: number | undefined;
	database_estimate: number | undefined;


  constructor() {
    console.log("Base_layers_class constructor");
    //singleton
    if (instance) {
      return instance;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;

    this.Base_gui = new Base_gui_class();
    this.Image_trim = new Image_trim_class();
    this.View_ruler = new View_ruler_class();

    this.canvas = document.getElementById("canvas_minipaint") as HTMLCanvasElement;
    if (!this.canvas) {
      console.error("Error: Canvas element not found");
      return;
    }
    this.ctx = (document.getElementById("canvas_minipaint") as HTMLCanvasElement).getContext("2d") as CanvasRenderingContext2D;
    this.ctx_preview = (document.getElementById("canvas_preview") as HTMLCanvasElement).getContext("2d");
    this.last_zoom = 1;
    this.auto_increment = 1;
    this.stable_dimensions = [];
    this.debug_rendering = false;
    this.render_success = null;
    this.disabled_filter_id = null;

  }

  /**
   * do preparation on start
   */
  init() {
    this.init_zoom_lib();

    if (app.Actions !== null) {
      void new app.Actions.Insert_layer_action({} as Layer).do();
    }

    const sel_config = {
      enable_background: false,
      enable_borders: true,
      enable_controls: false,
      enable_rotation: false,
      enable_move: false,
      data_function: function () {
        return config.layer;
      },
    };
    if (this.ctx) {
      this.Base_selection = new Base_selection_class(
        this.ctx,
        sel_config as any,
        "main"
      );
    }

    this.render(true);
  }

  init_zoom_lib() {
    zoomView.setBounds(0, 0, config.WIDTH, config.HEIGHT);
    if (this.ctx) {
      zoomView.setContext(this.ctx);
    }
    this.stable_dimensions = [config.WIDTH, config.HEIGHT];
  }

  pre_render() {
    this.ctx?.save();
    zoomView.canvasDefault();
    this.ctx?.clearRect(
      0,
      0,
      config.WIDTH * config.ZOOM,
      config.HEIGHT * config.ZOOM
    );
  }

  after_render() {
    config.need_render = false;
    config.need_render_changed_params = false;
    this.ctx?.restore();
    zoomView.canvasDefault();
  }

  /**
   * renders all layers objects on main canvas
   *
   * @param {bool} force
   */
  // @ts-ignore
  render(force? = false) {
    if (!force) {
      //request render and exit
      config.need_render = true;
      return;
    }

    if (
      this.stable_dimensions[0] != config.WIDTH ||
      this.stable_dimensions[1] != config.HEIGHT
    ) {
      //dimensions changed - re-init zoom lib
      this.init_zoom_lib();
    }

    if (config.need_render == true) {
      this.render_success = null;

      if (this.debug_rendering === true) {
        console.log("Rendering...");
      }

      if (this.Base_gui.GUI_preview == null) {
        throw new Error("GUI_preview is null");
        alert("GUI_preview is null");

      }

      if (this.last_zoom != config.ZOOM) {
        //change zoom
        zoomView.scaleAt(
          this.Base_gui.GUI_preview.zoom_data?.x ?? 0,
          this.Base_gui.GUI_preview.zoom_data?.y ?? 0,
          config.ZOOM / this.last_zoom
        );
      } else if (this.Base_gui.GUI_preview?.zoom_data?.move_pos != null) {
        //move visible window
        const pos = this.Base_gui.GUI_preview.zoom_data.move_pos;
        const pos_global = zoomView.toScreen(pos);
        zoomView.move(-pos_global.x, -pos_global.y);
        if (this.Base_gui.GUI_preview.zoom_data.move_pos != null) {
          this.Base_gui.GUI_preview.zoom_data.move_pos = {
            x: 0,
            y: 0,
          };
        }
      }

      //prepare
      this.pre_render();

      //take data
      const layers_sorted = this.get_sorted_layers();

      zoomView.apply();

      const newCanvas = this.create_new_canvas(
        // @ts-ignore
        null,
        config.WIDTH,
        config.HEIGHT
      );



      if (!this.ctx) {
        throw new Error("ctx is null");

      }

      this.render_objects(this.ctx, newCanvas, layers_sorted, () => {
        this.ctx?.save();
      });

      //grid
      this.Base_gui.draw_grid(this.ctx);

      //guides
      this.Base_gui.draw_guides(this.ctx);

      //render selected object controls
      this.Base_selection?.draw_selection();

      //active tool overlay
      this.render_overlay();

      //render preview
      this.render_preview(layers_sorted);

      //reset
      this.after_render();

      this.last_zoom = config.ZOOM;

      this.Base_gui.GUI_details?.render_details();
      this.View_ruler.render_ruler();

      if (this.render_success === false) {
        alert("Rendered with errors.");
      }
    }

    requestAnimationFrame(() => {
      this.render(force);
    });
  }

  render_overlay() {
    const render_class = config.TOOL.name;
    const render_function = "render_overlay";

    // @ts-ignore
    if (typeof this.Base_gui.GUI_tools.tools_modules[render_class].object[render_function] != "undefined") {
      // @ts-ignore
      this.Base_gui.GUI_tools.tools_modules[render_class].object[render_function](this.ctx);
    }
  }

  /**
   * LEGACY: use create_new_canvas();
   */
  createNewCanvas(ctx: CanvasRenderingContext2D, h: any, w: any) {
    this.create_new_canvas(ctx, w, h);
  }

  /**
   * Creates a fresh new canvas with the same height and width as the provided one
   * @param {canvas.context|null} ctx
   * @param {number} [width]
   * @param {number} [height]
   */
  create_new_canvas(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
    const newCanvas = document.createElement("canvas");
    if (width) {
      newCanvas.width = width;
    } else {
      newCanvas.width = ctx?.canvas.width ?? 0;
    }

    if (height) {
      newCanvas.height = height;
    } else {
      newCanvas.height = ctx?.canvas.height ?? 0;
    }

    return newCanvas;
  }

  /**
   * LEGACY: use render_objects()
   */
  renderObjects(ctx: CanvasRenderingContext2D, tempCanvas: HTMLCanvasElement, layers: Layer[], prepare: { (): void; (): void; (): void; (): any; }, shouldSkip: { (value: any): true | undefined; (arg0: any): any; } | undefined) {
    this.render_objects(ctx, tempCanvas, layers, prepare, shouldSkip);
  }

  /**
   * Renders objects based on the provided layers
   * @param {canvas.context} ctx - Main canvas context where it needs to be rendered
   * @param {canvas} tempCanvas - A temporary canvas which is a copy of the original canvas, but will be used if there will be needed to isolate an effect from others
   * @param {Object[]} layers - Array of layers
   * @param {Function} prepare - An optional function to prepare temporary and main canvases before the render if needed
   * @param {Function} shouldSkip - An optional boolean function for skipping those layers which are not needed to be rendered
   */
  render_objects(ctx: CanvasRenderingContext2D, tempCanvas: HTMLCanvasElement, layers: Layer[], prepare: { (): void; (): void; (): void; (): any; }, shouldSkip?: { (value: any): true | undefined; (arg0: any): any; } | undefined) {
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      throw new Error("tempCtx is null");
    }
    // Prepare the temporary canvas if needed
    prepare && prepare();

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const nextLayer = layers[i - 1];

      // If the previous layer has clip masking effect and the current one is not the other end of the pair,
      // then render the temporary canvas for clip masking on top of the current.

      // Skip the layer if not needed to be rendered
      if (shouldSkip && shouldSkip(layer)) {
        continue;
      }

      // If the layer or next layer has clip masking effect (source-atop).
      // If there are such layers, this will make sure that layers will be rendered
      // in an isolated temporary canvas
      if (
        layer.composition === "source-atop" ||
        (nextLayer && nextLayer.composition === "source-atop")
      ) {
        // Apply the effect in a isolated temporary canvas
        tempCtx.globalAlpha = layer.opacity / 100;
        tempCtx.globalCompositeOperation = layer.composition as GlobalCompositeOperation;

        // If the next layer has the clip masking effect then
        // isolated the shadow filter from temporary canvas and keep that in the original canvas
        if (nextLayer?.composition === "source-atop") {
          // Render the layer
          this.render_object(ctx, layer);
          // Then remove the shadow (if it exists) from the render process in the temporary canvas
          const filters = layer.filters.filter((filter: { name: string; }) => {
            return filter.name !== "shadow";
          });
          this.render_object(tempCtx, {
            ...layer,
            filters,
          });
        } else {
          // If we are in this condition, then it means this is the last layer of clipped layers pair.
          // Render clipped layers on the temporary canvas
          this.render_object(tempCtx, layer);

          // Render the clipped layers on top of the current canvas
          ctx.restore();
          ctx.drawImage(tempCanvas, 0, 0);


          // Prepare canvas to since we called restore
          prepare && prepare();
          // Clear temporary canvas
          tempCtx.globalCompositeOperation = "" as GlobalCompositeOperation;
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
      } else {
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.composition as GlobalCompositeOperation;
        this.render_object(ctx, layer);
      }
    }

  }

  render_preview(layers: Layer[]) {
    let w = this.Base_gui.GUI_preview?.PREVIEW_SIZE?.w ?? 0;
    let h = this.Base_gui.GUI_preview?.PREVIEW_SIZE?.h ?? 0;

    if (!this.ctx_preview) {
      throw new Error("ctx_preview is null");
    }
    this.ctx_preview.save();
    this.ctx_preview.clearRect(0, 0, w, h);

    const newCanvas = this.create_new_canvas(this.ctx_preview);
    newCanvas.getContext("2d")?.scale(w / config.WIDTH, h / config.HEIGHT);
    this.render_objects(this.ctx_preview, newCanvas, layers, () => {
      this.ctx_preview?.save();
      //prepare scale
      this.ctx_preview?.scale(w / config.WIDTH, h / config.HEIGHT);
    });

    this.ctx_preview.restore();
    this.Base_gui.GUI_preview?.render_preview_active_zone();
  }

  /**
   * export current layers to given canvas
   *
   * @param {canvas.context} ctx
   * @param {object} object
   * @param {boolean} is_preview
   */
  render_object(ctx: CanvasRenderingContext2D, object: Layer, is_preview = false) {
    if (object.visible == false || object.type == null) return;

    this.pre_render_object(ctx, object);

    //example with canvas object - other types should overwrite this method
    if (object.type == "image") {
      //image - default behavior
      ctx.save();

      ctx.translate(object.x + object.width / 2, object.y + object.height / 2);
      ctx.rotate(((object.rotate ?? 0) * Math.PI) / 180);
      // TODO - Not sure why the check should be with null,
      // if nothing will break, then better to check if it's just truthy
      ctx.drawImage(
        // @ts-ignore
        object.link_canvas != null ? object.link_canvas : object.link,
        -object.width / 2,
        -object.height / 2,
        object.width,
        object.height
      );

      ctx.restore();
    } else {
      //call render function from other module

      // @ts-ignore
      let render_class = object.render_function[0];
      
      // @ts-ignore
      let render_function = object.render_function[1];
      // @ts-ignore
      if (typeof this.Base_gui.GUI_tools.tools_modules[render_class] != "undefined") {
        // @ts-ignore
        this.Base_gui.GUI_tools.tools_modules[render_class].object[render_function](ctx, object, is_preview);
      } else {
        this.render_success = false;
        console.log("Error: unknown layer type: " + object.type);
      }
    }

    this.after_render_object(ctx, object);
  }

  /**
   * Gets called before render_object starts it's job
   * @param {canvas.context} ctx
   * @param {object} object
   */
  pre_render_object(ctx: CanvasRenderingContext2D, object: Layer) {
    //apply pre-filters
    for (let i in object.filters) {
      const filter = object.filters[i];
      if (filter.id == this.disabled_filter_id) {
        continue;
      }

      filter.name = filter.name.replace("drop-shadow", "shadow");

      //find filter
      let found = false;
      for (i in this.Base_gui.modules) {
        if (i.indexOf("effects") == -1 || i.indexOf("abstract") > -1) continue;

        let filter_class = this.Base_gui.modules[i];
        let module_name = i.split("/").pop();
        if (module_name == filter.name) {
          //found it
          found = true;
          filter_class.render_pre(ctx, filter, object);
        }
      }
      if (found == false) {
        this.render_success = false;
        console.log("Error: can not find filter: " + filter.name);
      }
    }
  }

  /**
   * Gets called after when render_object finishes it's job
   * @param {canvas.context} ctx
   * @param {object} object
   */
  after_render_object(ctx: CanvasRenderingContext2D, object: Layer | null) {
    //apply post-filters
    for (let i in object?.filters) {
      // @ts-ignore
      let filter = object.filters[i];
      if (filter.id == this.disabled_filter_id) {
        continue;
      }
      filter.name = filter.name.replace("drop-shadow", "shadow");

      //find filter
      let found = false;
      for (let i in this.Base_gui.modules) {
        if (i.indexOf("effects") == -1 || i.indexOf("abstract") > -1) continue;

        let filter_class = this.Base_gui.modules[i];
        let module_name = i.split("/").pop();
        if (module_name == filter.name) {
          //found it
          found = true;
          filter_class.render_post(ctx, filter, object);
        }
      }
      if (found == false) {
        this.render_success = false;
        console.log("Error: can not find filter: " + filter.name);
      }
    }
  }

  /**
   * creates new layer
   *
   * @param {array} settings
   * @param {boolean} can_automate
   */
  async insert(settings: any, can_automate = true) {
    return app.State?.do_action(
      new app.Actions.Insert_layer_action(settings, can_automate)
    );
  }

  /**
   * autoresize layer, based on dimensions, up - always, if 1 layer - down.
   *
   * @param {int} width
   * @param {int} height
   * @param {int} layer_id
   * @param {boolean} can_automate
   */
  async autoresize(width: undefined, height: undefined, layer_id: undefined, can_automate = true) {
    return app.State?.do_action(
      new app.Actions.Autoresize_canvas_action(
        width,
        height,
        layer_id,
        can_automate
      )
    );
  }

  /**
   * returns layer
   *
   * @param {int} id
   * @returns {object}
   */
  get_layer(id: string | number | undefined): Layer {
    if (id == undefined) {
      id = config.layer?.id;
    }
    for (let i in config.layers) {
      if (config.layers[i].id == id) {
        return config.layers[i];
      }
    }
    alert(`Error: can not find layer with id: ${id}`);
    throw new Error(`Error: can not find layer with id: ${id}`);
  }

  /**
   * removes layer
   *
   * @param {int} id
   * @param {boolean} force - Force to delete first layer?
   */
  async delete(id: any, force: any) {
    return app.State?.do_action(new app.Actions.Delete_layer_action(id, force));
  }

  /*
   * removes all layers
   */
  async reset_layers(auto_insert: any) {
    return app.State?.do_action(
      new app.Actions.Reset_layers_action(auto_insert)
    );
  }

  /**
   * toggle layer visibility
   *
   * @param {int} id
   */
  async toggle_visibility(id: number) {
    return app.State?.do_action(
      new app.Actions.Toggle_layer_visibility_action(id)
    );
  }

  /*
   * renew layers HTML
   */
  refresh_gui() {
    this.Base_gui.GUI_layers?.render_layers();
  }

  /**
   * marks layer as selected, active
   *
   * @param {int} id
   */
  async select(id: number) {
    return app.State?.do_action(new app.Actions.Select_layer_action(id));
  }

  /**
   * change layer opacity
   *
   * @param {int} id
   * @param {int} value 0-100
   */
  async set_opacity(id: number, value: number) {
    value = value;
    if (value < 0 || value > 100) {
      //reset
      value = 100;
    }
    return app.State?.do_action(
      new app.Actions.Update_layer_action(id, {
        opacity: value
      } as any)
    );
  }

  /**
   * clear layer data
   *
   * @param {int} id
   */
  async layer_clear(id: number) {
    return app.State?.do_action(new app.Actions.Clear_layer_action(id));
  }

  /**
   * move layer up or down
   *
   * @param {int} id
   * @param {int} direction
   */
  async move(id: number, direction: number) {
    return app.State?.do_action(
      new app.Actions.Reorder_layer_action(id, direction)
    );
  }

  /**
   * clone and sort.
   */
  get_sorted_layers() {
    return config.layers.concat().sort(
      //sort function
      (a, b) => (b.order ?? 0) - (a.order ?? 0)
    );
  }

  /**
   * checks if layer empty
   *
   * @param {int} id
   * @returns {Boolean}
   */
  is_layer_empty(id: string | number | undefined) {
    let link = this.get_layer(id);
    if (link == null) {
      return true;
    }
    if (
      (link.width == 0 || link.width === null) &&
      (link.height == 0 || link.height === null) &&
      link.data == null
    ) {
      return true;
    }

    return false;
  }

  /**
   * find next layer
   *
   * @param {int} id layer id
   * @returns {layer|null}
   */
  find_next(id: number) {
    const link = this.get_layer(id);
    const layers_sorted = this.get_sorted_layers();

    let last = null;
    for (let i = layers_sorted.length - 1; i >= 0; i--) {
      const value = layers_sorted[i];

      if (last != null && last.id == link?.id) {
        return value;
      }
      last = value;
    }

    return null;
  }

  /**
   * find previous layer
   *
   * @param {int} id layer id
   * @returns {layer|null}
   */
  find_previous(id: number) {
    const link = this.get_layer(id);
    const layers_sorted = this.get_sorted_layers();

    let last = null;
    for (const i in layers_sorted) {
      const value = layers_sorted[i];

      if (last != null && last.id == link?.id) {
        return value;
      }
      last = value;
    }

    return null;
  }

  /**
   * returns global position, for example if canvas is zoomed, it will convert relative mouse position to absolute
   * at 100% zoom.
   *
   * @param {int} x
   * @param {int} y
   * @returns {object} keys: x, y
   */
  get_world_coords(x: number, y: number) {
    return zoomView.toWorld(x, y);
  }

  /**
   * register new live filter
   *
   * @param {int} layer_id
   * @param {string} name
   * @param {object} params
   */
  add_filter(layer_id?: number, name?: string, params?: undefined) {
    return app.State?.do_action(
      new app.Actions.Add_layer_filter_action(layer_id, name, params)
    );
  }

  /**
   * delete live filter
   *
   * @param {int} layer_id
   * @param {string} filter_id
   */
  delete_filter(layer_id: any, filter_id: any) {
    return app.State?.do_action(
      new app.Actions.Delete_layer_filter_action(layer_id, filter_id)
    );
  }

  /**
   * exports all layers to canvas for saving
   *
   * @param {canvas.context} ctx
   * @param {int} layer_id Optional
   * @param {boolean} is_preview Optional
   */
  convert_layers_to_canvas(ctx: CanvasRenderingContext2D, layer_id = null, is_preview = true) {
    const newCanvas = this.create_new_canvas(ctx);
    const layers_sorted = this.get_sorted_layers();
    this.render_objects(ctx, newCanvas, layers_sorted, () => {
      ctx.save();
    }, (value) => {
      if (value.visible == false || value.type == null) {
        return true;
      }
      if (layer_id != null && value.id != layer_id) {
        return true;
      }
    });
  }

  /**
   * exports (active) layer to canvas for saving
   *
   * @param {int} layer_id or current layer by default
   * @param {boolean} actual_area used for resized image. Default is false.
   * @param {boolean} can_trim default is true
   * @returns {canvas}
   */
  convert_layer_to_canvas(layer_id?: number, actual_area = false, can_trim?: boolean) {
    if (actual_area == null) actual_area = false;
    if (!layer_id) layer_id = config.layer?.id;
    const link = this.get_layer(layer_id);
    if(link == null) {
      throw new Error("link is null");
    }
    let offset_x = 0;
    let offset_y = 0;

    //create tmp canvas
    const canvas = document.createElement("canvas");
    if (actual_area === true && link.type == "image") {
      canvas.width = link.width_original ?? 0;
      canvas.height = link.height_original;
      can_trim = false;
    } else {
      canvas.width = Math.max(link.width ?? 0, config.WIDTH);
      canvas.height = Math.max(link.height ?? 0, config.HEIGHT);
    }

    //add data
    if (actual_area === true && link.type == "image") {
      canvas.getContext("2d")?.drawImage(link.link as CanvasImageSource, 0, 0);
    } else {
      this.render_object(canvas.getContext("2d") as CanvasRenderingContext2D, link);
    }

    //trim
    if ((can_trim == true || can_trim == undefined) && link?.type != null) {
      let trim_info = this.Image_trim.get_trim_info(layer_id);
      if (
        trim_info.left > 0 ||
        trim_info.top > 0 ||
        trim_info.right > 0 ||
        trim_info.bottom > 0
      ) {
        offset_x = trim_info.left;
        offset_y = trim_info.top;

        const w = canvas.width - trim_info.left - trim_info.right;
        const h = canvas.height - trim_info.top - trim_info.bottom;
        if (w > 1 && h > 1) {
          this.Helper.change_canvas_size(canvas, w, h, offset_x, offset_y);
        }
      }
    }

    canvas.dataset.x = String(offset_x);
    canvas.dataset.y = String(offset_y);

    return canvas;
  }

  /**
   * updates layer image data
   *
   * @param {canvas} canvas
   * @param {int} layer_id (optional)
   */
  update_layer_image(canvas: any, layer_id: any) {
    return app.State?.do_action(
      new app.Actions.Update_layer_image_action(canvas, layer_id)
    );
  }

  /**
   * returns canvas dimensions.
   *
   * @returns {object}
   */
  get_dimensions() {
    return {
      width: config.WIDTH,
      height: config.HEIGHT,
    };
  }

  /**
   * returns all layers
   *
   * @returns {array}
   */
  get_layers() {
    return config.layers;
  }

  /**
   * disabled filter by id
   *
   * @param filter_id
   */
  disable_filter(filter_id: number) {
    this.disabled_filter_id = filter_id;
  }

  /**
   * finds layer filter by filter ID
   *
   * @param filter_id
   * @param filter_name
   * @param layer_id
   * @returns {object}
   */
  find_filter_by_id(filter_id: number, filter_name: string, layer_id = 0) {
    let layer: Layer | null = null;
    if (layer_id === 0) {
      layer = config.layer;
    } else {
      layer = this.get_layer(layer_id);
    }

    const filter = {};
    const filters = layer?.filters;
    if(!layer || !filters) {
      return filter;
    }
    for (const tmpFilter of filters) {
      if (tmpFilter.name == filter_name && tmpFilter.id == filter_id) {
        return tmpFilter.params;
      }
    }

    return filter;
  }
}

export default Base_layers_class;
