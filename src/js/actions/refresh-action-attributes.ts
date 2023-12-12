import app from "../app";
import {Base_action} from "./base";

export class Refresh_action_attributes_action extends Base_action {
  private readonly call_when: string;

  /**
   * Resizes/renders the canvas at the specified step. Usually used on both sides of a config update action.
   *
   */
  constructor(call_when = "undo") {
    super("refresh_action_attributes", "Refresh Action Attributes");
    this.call_when = call_when;
  }

  do() {
    super.do();
    if (this.call_when === "do") {
      app.GUI?.GUI_tools?.show_action_attributes();
    }
  }

  undo() {
    super.undo();
    if (this.call_when === "undo") {
      app.GUI?.GUI_tools?.show_action_attributes();
    }
  }
}