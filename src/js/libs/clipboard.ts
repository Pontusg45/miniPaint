// @ts-nocheck
import Helper_class from "./helpers";

/**
 * image pasting into canvas
 * 
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
class Clipboard_class {
	Helper: Helper_class;
	on_paste: (source: string, width: number, height: number) => void;
	ctrl_pressed: boolean;
	command_pressed: boolean;
	pasteCatcher: HTMLDivElement | undefined;
	paste_mode: string;

	constructor(on_paste: (source: string, width: number, height: number) => void = () => {}) {

		this.Helper = new Helper_class();

		this.on_paste = on_paste;
		this.ctrl_pressed = false;
		this.command_pressed = false;
		this.pasteCatcher;
		this.paste_mode = "";

		//handlers
		document.addEventListener("keydown", e => {
			this.on_keyboard_action(e);
		}, false); //firefox fix
		document.addEventListener("keyup", e => {
			this.on_keyboardup_action(e);
		}, false); //firefox fix
		document.addEventListener("paste", e => {
			this.paste_auto(e);
		}, false); //official paste handler

		this.init();
	}

	//constructor - prepare
	init() {

		//if using auto
		if (window.Clipboard)
			return true;

		this.pasteCatcher = document.createElement("div");
		this.pasteCatcher.setAttribute("id", "paste_ff");
		this.pasteCatcher.setAttribute("contenteditable", "");
		this.pasteCatcher.style.cssText = "opacity:0;position:fixed;top:0px;left:0px;";
		this.pasteCatcher.style.marginLeft = "-20px";
		this.pasteCatcher.style.width = "10px";
		document.body.appendChild(this.pasteCatcher);

		// create an observer instance
		const observer = new MutationObserver(mutations => {
			mutations.forEach( mutation => {
				if (this.paste_mode === "auto" || this.ctrl_pressed|| mutation.type !== "childList")
					return true;

				//if paste handle failed - capture pasted object manually
				if (mutation.addedNodes.length == 1) {
					if (mutation.addedNodes[0].src !== undefined) {
						//image
						this.paste_createImage(mutation.addedNodes[0].src ?? "");
					}
					//register cleanup after some time.
					setTimeout(() => {
						if(this.pasteCatcher) {
							this.pasteCatcher.innerHTML = "";
						}
					}, 20);
				}
			});
		});
		const target = document.getElementById("paste_ff");
		const config = {attributes: true, childList: true, characterData: true};
		if (target)
			observer.observe(target, config);
	}

	//default paste action
	paste_auto(e: ClipboardEvent) {
		if (this.Helper.is_input(e.target as HTMLElement))
			return;

		this.paste_mode = "";
		if (!window.Clipboard && this.pasteCatcher) {
			this.pasteCatcher.innerHTML = "";
		}
		if (e.clipboardData) {
			const items = e.clipboardData.items;
			if (items) {
				this.paste_mode = "auto";
				//access data directly
				for (let i = 0; i < items.length; i++) {
					if (items[i].type.indexOf("image") !== -1) {
						//image
						const blob = items[i].getAsFile() as any;
						const URLObj = window.URL || window.webkitURL;
						const source = URLObj.createObjectURL(blob);
						this.paste_createImage(source);
					}
				}
				e.preventDefault();
			}
			else {
				//wait for DOMSubtreeModified event
				//https://bugzilla.mozilla.org/show_bug.cgi?id=891247
			}
		}
	}

	//on keyboard press
	on_keyboard_action(event: KeyboardEvent) {
		const k = event.keyCode;
		//ctrl
		if (k == 17 || event.metaKey || event.ctrlKey) {
			if (this.ctrl_pressed == false)
				this.ctrl_pressed = true;
		}
		//v
		if (k == 86) {
			if (this.Helper.is_input(document.activeElement as HTMLInputElement)) {
				return false;
			}

			if (this.ctrl_pressed == true && !window.Clipboard)
				this.pasteCatcher?.focus();
		}
	}

	//on kaybord release
	on_keyboardup_action(event : KeyboardEvent) {
		//ctrl
		if (event.ctrlKey == false && this.ctrl_pressed == true) {
			this.ctrl_pressed = false;
		}
		//command
		else if (event.metaKey == false && this.command_pressed == true) {
			this.command_pressed = false;
			this.ctrl_pressed = false;
		}
	}

	//draw image
	paste_createImage(source : string) {
		const pastedImage = new Image();

		pastedImage.onload = () => {
			this.on_paste(source, pastedImage.width, pastedImage.height);
		};
		pastedImage.src = source;
	}
}

export default Clipboard_class;