import app from "../app.js";
import {Base_action} from "./base.js";

export class Prepare_canvas_action extends Base_action {
  private readonly call_when: string;

  /**
   * Resizes/renders the canvas at the specified step. Usually used on both sides of a config update action.
   *
   */
  constructor(call_when = "undo") {
    super("prepare_canvas", "Prepare Canvas");
    this.call_when = call_when;
  }

  do() {
    super.do();
    if (this.call_when === "do") {
      app.GUI?.prepare_canvas();
    }
  }

  undo() {
    super.undo();
    if (this.call_when === "undo") {
      app.GUI?.prepare_canvas();
    }
  }
}