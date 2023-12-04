import config from "../config";

/**
 * various helpers
 *
 * @author ViliusL
 */
class Helper_class {

  time: number;

  constructor() {
    this.time = 0;
  }

  get_url_parameters() {
    const queryDict = {} as {
      [key: string]: string
    };
    location.search.substr(1).split("&").forEach(
      function (item) {
        queryDict[item.split("=")[0]] = item.split("=")[1];
      }
    );

    return queryDict;
  }

  /**
   * starts timer
   */
  timer_start() {
    this.time = Date.now();
  }

  /**
   * calculates time between two calls.
   *
   * @param {string} name Optional
   * @param {boolean} echo Default is true.
   */
  timer_end(name: string, echo: boolean) {
    let text = `${Math.round(Date.now() - this.time) / 1000} s`;
    if (echo != undefined && echo === false)
      return text;
    if (name != undefined)
      text += ` (${name})`;
    console.log(text);
  }

  //format time
  format_time(datetime: string) {
    return new Date(datetime).toJSON().slice(0, 19).replace(/T/g, " ");
  }

  /**
   * Find the position of the first occurrence of string or false.
   *
   * @param {string} haystack
   * @param {string} needle
   * @param {number} offset
   * @returns {Boolean|String}
   */
  strpos(haystack: string, needle: string, offset = 0) {
    const i = (`${haystack}`).indexOf(needle, (offset || 0));
    return i === -1 ? false : i;
  }

  /**
   * return cookie value from global cookie
   *
   * @param {string} name
   * @returns {object|string}
   */
  getCookie(name: string): string {
    const cookie = this._getCookie("config") ;

    let parsedCookie: {
      [key: string]: string;
    };
    if (cookie === undefined)
      parsedCookie = {};
    else
      parsedCookie = JSON.parse(cookie) as {
        [key: string]: string;
      };

    if (parsedCookie[name] != undefined)
      return parsedCookie[name];
    else
      return "";
  }

  /**
   * sets cookie value to global cookie
   *
   * @param {string} name
   * @param {string|number} value
   */
  setCookie(name: string, value: string | number) {
    let cookie = this._getCookie("config");

    let parsedCookie: {
      [key: string]: string | number;
    };

    if (cookie == undefined)
      parsedCookie = {};
    else
      parsedCookie = JSON.parse(cookie) as {
        [key: string]: string | number;
      };



    parsedCookie[name] = value;
    cookie = JSON.stringify(cookie);

    this._setCookie("config", cookie);
  }

  _getCookie(NameOfCookie: string) {
    if (document.cookie.length > 0) {
      let begin = document.cookie.indexOf(`${NameOfCookie}=`);
      if (begin != -1) {
        begin += NameOfCookie.length + 1;
        let end = document.cookie.indexOf(";", begin);
        if (end == -1)
          end = document.cookie.length;
        return document.cookie.substring(begin, end);
      }
    }
    return "";
  }

  _setCookie(NameOfCookie: string, value: string, expire_days: number = 180) {
    if (expire_days == undefined)
      expire_days = 180;
    const ExpireDate = new Date();
    ExpireDate.setTime(ExpireDate.getTime() + (expire_days * 24 * 3600 * 1000));
    document.cookie = `${NameOfCookie}=${value}${`; expires=${ExpireDate.toUTCString()}`}`;
  }

  delCookie(NameOfCookie: string) {
    if (this.getCookie(NameOfCookie)) {
      document.cookie = `${NameOfCookie}=` +
        "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
  }

  getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  font_pixel_to_height(px: number) {
    return Math.round(px * 0.75);
  }

  hex(x: number) {
    const hexNumber = x;
    return (`0${hexNumber.toString(16)}`).slice(-2);
  }

  hex_set_hsl(hex: string, newHsl: { h?: number; s: number; l: number; }) {
    const rgb = this.hexToRgb(hex);
    if (rgb == null) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    if ("h" in newHsl) {
      hsl.h = newHsl.h ?? 0;
    }
    if ("s" in newHsl) {
      hsl.s = newHsl.s ?? 0;
    }
    if ("l" in newHsl) {
      hsl.l = newHsl.l ?? 0;
    }
    return this.hslToHex(hsl.h, hsl.s, hsl.l);
  }

  rgbToHex(r: number, g: number, b: number) {
    if (r > 255 || g > 255 || b > 255)
      throw new Error("Invalid color component");
    const tmp = ((r << 16) | (g << 8) | b).toString(16);

    return `#${(`000000${tmp}`).slice(-6)}`;
  }

  hexToRgb(hex: string) {
    if (hex[0] == "#")
      hex = hex.substring(1);
    if (hex.length === 3) {
      const temp = hex;
      let tempArray = [];
      hex = "";
      const regex = /^([a-f0-9])([a-f0-9])([a-f0-9])$/i;
      const regexResult = regex.exec(temp);
      if (regexResult == null) {
        throw new Error(`Invalid hex color: ${temp}`);
      } else {
        tempArray = regexResult.slice(1);
      }
      for (let i = 0; i < 3; i++)
        hex += tempArray[i] + tempArray[i];
    }
    const regex = /^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/i;
    const regexResult = regex.exec(hex);
    if (regexResult == null) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    const triplets = regexResult.slice(1);
    return {
      r: parseInt(triplets[0], 16),
      g: parseInt(triplets[1], 16),
      b: parseInt(triplets[2], 16),
      a: 255
    };
  }

  hslToHex(h: number | undefined, s: number, l: number) {
    const rgb = this.hslToRgb(h ?? 0, s, l);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  hsvToHex(h: number, s: number, v: number) {
    const rgb = this.hsvToRgb(h, s, v);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  hueToRgb(p: number, q: number, t: number) {
    if (t < 0)
      t += 1;
    if (t > 1)
      t -= 1;
    if (t < 1 / 6)
      return p + (q - p) * 6 * t;
    if (t < 1 / 2)
      return q;
    if (t < 2 / 3)
      return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  /**
   * Converts an HSL color value to RGB.
   * Assumes h, s, and l are contained in the set [0, 1]
   * Returns r, g, and b in the set [0, 255].
   *
   * Credit: https://gist.github.com/mjackson/5311256
   *
   * @param {number} h The hue
   * @param {number} s The saturation
   * @param {number} l The lightness
   * @return {Object} The RGB representation, r,g,b as keys.
   */
  hslToRgb(h: number, s: number, l: number) {
    let r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = this.hueToRgb(p, q, h + 1 / 3);
      g = this.hueToRgb(p, q, h);
      b = this.hueToRgb(p, q, h - 1 / 3);
    }

    return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
  }

  /**
   * Converts an RGB color value to HSL. Values are in range 0-1.
   * But real ranges are 0-360, 0-100%, 0-100%
   *
   * Credit: https://gist.github.com/mjackson/5311256
   *
   * @param {number} r red color value
   * @param {number} g green color value
   * @param {number} b blue color value
   * @return {object} The HSL representation
   */
  rgbToHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s;
    const l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {h, s, l};
  }

  /**
   * Converts an RGB color value to HSV.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and v in the set [0, 1].
   *
   * Credit: https://gist.github.com/mjackson/5311256
   *
   * @param Number r The red color value
   * @param Number g The green color value
   * @param Number b The blue color value
   * @return {object} The HSL representation
   */
  rgbToHsv(r: number, g: number, b: number) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max == 0 ? 0 : d / max;
    if (max == min) {
      h = 0; // achromatic
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {h, s, v};
  }

  /**
   * Converts an HSV color value to RGB.
   * Assumes h, s, and v are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * Credit: https://gist.github.com/mjackson/5311256
   *
   * @param Number h The hue
   * @param Number s The saturation
   * @param Number v The value
   * @return {object} The RGB representation
   */
  hsvToRgb(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v, g = t, b = p;
        break;
      case 1:
        r = q, g = v, b = p;
        break;
      case 2:
        r = p, g = v, b = t;
        break;
      case 3:
        r = p, g = q, b = v;
        break;
      case 4:
        r = t, g = p, b = v;
        break;
      case 5:
        r = v, g = p, b = q;
        break;
    }

    return {r: r * 255, g: g * 255, b: b * 255};
  }

  /**
   * Converts an HSV color value to HSL.
   * Assumes h, s, and v are contained in the set [0, 1] and
   * returns h, s, and l in the set [0, 1].
   *
   * @param Number h The hue
   * @param Number s The saturation
   * @param Number v The value
   * @return {object} The HSL representation
   */
  hsvToHsl(h: number, s: number, v: number) {
    return {
      h,
      s: s * v / Math.max(0.00000001, ((h = (2 - s) * v) < 1 ? h : 2 - h)),
      l: h / 2
    };
  }

  /**
   * Converts an HSL color value to HSV.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns h, s, and v in the set [0, 1].
   *
   * @param Number h The hue
   * @param Number s The saturation
   * @param Number l The value
   * @return {object} The HSV representation
   */
  hslToHsv(h: number, s: number, l: number) {
    s *= l < .5 ? l : 1 - l;
    return {
      h,
      s: 2 * s / Math.max(0.00000001, (l + s)),
      v: l + s
    };
  }

  remove_selection() {
    if (window == null) {
      return;
    }
    if (window.getSelection) {
      if (window.getSelection()?.empty) // Chrome
        window.getSelection()?.empty();
      else if (window.getSelection()?.removeAllRanges) // Firefox
        window.getSelection()?.removeAllRanges();
    } else if (document.getSelection() !== null) // IE?
      document.getSelection()?.empty();
  }

  //credits: richard maloney 2006
  darkenColor(color: string, v: number) {
    if (color.length > 6) {
      color = color.substring(1, color.length);
    }
    const rgb = parseInt(color, 16);
    let r = Math.abs(((rgb >> 16) & 0xFF) + v);
    if (r > 255)
      r = r - (r - 255);
    let g = Math.abs(((rgb >> 8) & 0xFF) + v);
    if (g > 255)
      g = g - (g - 255);
    let b = Math.abs((rgb & 0xFF) + v);
    if (b > 255)
      b = b - (b - 255);
    let newR = Number(r < 0 || isNaN(r)) ? "0" : ((r > 255) ? 255 : r).toString(16);
    if (newR.length == 1)
      newR = `0${r}`;
    let newG = Number(g < 0 || isNaN(g)) ? "0" : ((g > 255) ? 255 : g).toString(16);
    if (newG.length == 1)
      newG = `0${g}`;
    let newB = Number(b < 0 || isNaN(b)) ? "0" : ((b > 255) ? 255 : b).toString(16);
    if (newB.length == 1)
      newB = `0${b}`;
    return `#${newR}${newG}${newB}`;
  }

  /**
   * JavaScript Number Formatter, author: KPL, KHL
   *
   * @param {int} n
   * @param {int} maximumFractionDigits
   * @returns {string}
   */
  number_format(n: string | number, maximumFractionDigits: number) {
    const x = parseFloat(n.toString());
    let number = x.toLocaleString("us", {minimumFractionDigits: 0, maximumFractionDigits: maximumFractionDigits});
    number = number.replaceAll(",", "");
    return parseFloat(number);
  }

  check_input_color_support() {
    const i = document.createElement("input");
    i.setAttribute("type", "color");
    return i.type !== "text";
  }

  b64toBlob(b64Data: string, contentType: string, sliceSize: number) {
    contentType = contentType || "";
    sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  escapeHtml(text: string) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  isNumeric(n: string | number) {
    const numberString = n.toString();
    return !isNaN(parseFloat(numberString)) && isFinite(parseInt(numberString));
  }

  ucfirst(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * change canvas size without loosing data
   *
   * @param {canvas} canvas
   * @param {number} width
   * @param {number} height
   * @param {number} offset_x
   * @param {number} offset_y
   */
  change_canvas_size(canvas: HTMLCanvasElement, width: number, height: number, offset_x: number | undefined, offset_y: number | undefined) {
    if (offset_x == undefined)
      offset_x = 0;
    if (offset_y == undefined)
      offset_y = 0;

    //copy data;
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d");
    if (ctx == null) {
      console.log("Error: canvas.getContext(\"2d\") is null");
      return;
    }
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);

    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    //restore image
    if (canvas.getContext("2d") == null) {
      console.log("Error: canvas.getContext(\"2d\") is null");
      return;
    } else {
      canvas.getContext("2d")?.drawImage(tmp, -offset_x, -offset_y);
    }
  }

  image_round(ctx_main: CanvasRenderingContext2D, mouse_x: number, mouse_y: number, size_w: number, size_h: number, img_data: ImageData, anti_aliasing = false) {
    //create tmp canvas
    const canvasTmp = document.createElement("canvas");
    canvasTmp.width = size_w;
    canvasTmp.height = size_h;

    const size_half_w = Math.round(size_w / 2);
    const size_half_h = Math.round(size_h / 2);
    const ctx = canvasTmp.getContext("2d");
    if (ctx == null) {
      console.log("Error: canvas.getContext(\"2d\") is null");
      return;
    }
    const width = canvasTmp.width;
    const height = canvasTmp.height;
    const xx = mouse_x - size_half_w;
    const yy = mouse_y - size_half_h;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    //draw main data
    ctx.putImageData(img_data, 0, 0);
    ctx.globalCompositeOperation = "destination-in";

    //create form
    const gradient = ctx.createRadialGradient(size_half_w, size_half_h, 0, size_half_w, size_half_h, size_half_w);
    gradient.addColorStop(0, "#ffffff");
    if (anti_aliasing == true)
      gradient.addColorStop(0.8, "#ffffff");
    else
      gradient.addColorStop(0.99, "#ffffff");
    gradient.addColorStop(1, "rgba(255,255,255,0");
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.ellipse(size_half_w, size_half_h, size_w * 2, size_h * 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx_main.drawImage(canvasTmp, 0, 0, size_w, size_h, xx, yy, size_w, size_h);
    //reset
    ctx.restore();
    ctx.clearRect(0, 0, width, height);
  }

  is_input(element?: HTMLInputElement | null) {
    if (!element) {
      return false;
    }
    if (element.type == "text" || element.tagName == "INPUT" || element.type == "textarea") {
      return true;
    } else {
      return element.closest(".ui_color_picker_gradient, .ui_number_input, .ui_range, .ui_swatches") != null;
    }
  }

  //if IE 11 or Edge
  is_edge_or_ie() {
    //ie11 check
    /* if( !(window.ActiveXObject) && "ActiveXObject" in window )
      return true; */
    //edge
    if (navigator.userAgent.indexOf("Edge/") != -1)
      return true;
    return false;
  }

  // Credit: https://stackoverflow.com/questions/27078285/simple-throttle-in-js
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  throttle(func, wait: number, options?: {
    leading?: boolean;
    trailing?: boolean;
  }) {
    let context: this | null, args: IArguments | null, result: any;
    let timeout: string | number | NodeJS.Timeout | null | undefined = null;
    let previous = 0;
    if (!options) options = {};
    const later = function () {
      previous = options?.leading === false ? 0 : Date.now();
      timeout = null;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return () => {
      const now = Date.now();
      if (!previous && options?.leading === false) previous = now;
      const remaining = wait - (now - previous);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      context = this;
      // eslint-disable-next-line prefer-rest-params
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options?.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    };
  }

  /**
   * draws line that is visible on white and black backgrounds.
   *
   * @param ctx
   * @param start_x
   * @param start_y
   * @param end_x
   * @param end_y
   */
  draw_special_line(ctx: CanvasRenderingContext2D, start_x: number, start_y: number, end_x: number, end_y: number) {
    const wholeLineWidth = 2 / config.ZOOM;
    const halfLineWidth = wholeLineWidth / 2;

    ctx.lineWidth = wholeLineWidth;
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.beginPath();
    ctx.moveTo(start_x - halfLineWidth, start_y);
    ctx.lineTo(end_x - halfLineWidth, end_y);
    ctx.stroke();

    ctx.lineWidth = halfLineWidth;
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.beginPath();
    ctx.moveTo(start_x - halfLineWidth, start_y);
    ctx.lineTo(end_x - halfLineWidth, end_y);
    ctx.stroke();
  }

  /**
   * draws control point that is visible on white and black backgrounds.
   *
   * @param ctx
   * @param x
   * @param y
   * @returns {Path2D}
   */
  draw_control_point(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const dx = 0;
    const dy = 0;
    const block_size = 12 / config.ZOOM;
    const wholeLineWidth = 2 / config.ZOOM;

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = wholeLineWidth;

    //create path
    const circle = new Path2D();
    circle.arc(x + dx * block_size, y + dy * block_size, block_size / 2, 0, 2 * Math.PI);

    //draw
    ctx.fill(circle);
    ctx.stroke(circle);

    return circle;
  }

  /**
   * converts internal unit (pixel) to user defined
   *
   * @param data
   * @param type
   * @param resolution
   * @returns {string|number}
   */
  get_user_unit(data: string | number, type: string, resolution: number) {
    data = parseFloat(data.toString());

    if (type == "pixels") {
      //no conversion
      return parseInt(data.toString());
    } else if (type == "inches") {
      return this.number_format(data / resolution, 3);
    } else if (type == "centimeters") {
      return this.number_format(data / resolution * 2.54, 3);
    } else if (type == "millimetres") {
      return this.number_format(data / resolution * 25.4, 3);
    }
    return 0;
  }

  /**
   * converts user defined unit to internal (pixels)
   *
   * @param data
   * @param type
   * @param resolution
   * @returns {number}
   */
  get_internal_unit(data: string | number, type: string, resolution: number) {
    data = parseFloat(data.toString());

    if (type == "pixels") {
      //no conversion
      return parseInt(data.toString());
    } else if (type == "inches") {
      return Math.ceil(data * resolution);
    } else if (type == "centimeters") {
      return Math.ceil(data * resolution / 2.54);
    } else if (type == "millimetres") {
      return Math.ceil(data * resolution / 25.4);
    }
    return 0;
  }

}

export default Helper_class;