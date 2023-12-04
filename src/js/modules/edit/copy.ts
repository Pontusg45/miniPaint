import config from "../../config";
import Base_layers_class from "../../core/base-layers.js";
import File_save_class from "../file/save.js";
import Helper_class from "../../libs/helpers.js";


let instance: Copy_class | null = null;

class Copy_class {
	Base_layers: Base_layers_class = new Base_layers_class;
	Helper: Helper_class = new Helper_class;
	File_save: File_save_class = new File_save_class;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;


		//events
		document.addEventListener("keydown", (event) => {
			const code = event.key.toLowerCase();
			const ctrlDown = event.ctrlKey || event.metaKey;
			if (event.target && this.Helper.is_input(event.target))
				return;

			if (code == "c" && ctrlDown == true) {
				//copy to clipboard
				this.copy_to_clipboard();
			}
		}, false);
	}

	async copy_to_clipboard(){

		const canWriteToClipboard = await this.askWritePermission();
		if (canWriteToClipboard) {

			//get data - current layer
			const canvas = this.Base_layers.convert_layer_to_canvas();
			const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

			if (config.TRANSPARENCY == false) {
				//add white background
				ctx.globalCompositeOperation = "destination-over";
				this.File_save.fillCanvasBackground(ctx, "#ffffff");
				ctx.globalCompositeOperation = "source-over";
			}

			//save using lib
			canvas.toBlob( (blob) => {
				if (blob == null) {
					throw new Error("Blob is null");
				}
				this.setToClipboard(blob);
			});
		}
		else{
			alert("Missing permissions to write to Clipboard.cc");
		}
	}

	async setToClipboard(blob: Blob) {
		const data = [new ClipboardItem({ [blob.type]: blob })];
		await navigator.clipboard.write(data);
	}

	async askWritePermission() {
		try {
			// The clipboard-write permission is granted automatically to pages
			// when they are the active tab. So it's not required, but it's more safe.
			const { state } = await navigator.permissions.query({ name: "clipboard-write" as PermissionName });
			return state === "granted";
		}
		catch (error) {
			// Browser compatibility / Security error (ONLY HTTPS) ...
			return false;
		}
	}
}

export default Copy_class;
