// @ts-nocheck
import app from "../../app";
import config from "../../config";
import Base_layers_class from "../../core/base-layers";
import Base_gui_class from "../../core/base-gui";
import Dialog_class from "../../libs/popup";
import Helper_class from "../../libs/helpers";
import Clipboard_class from "../../libs/clipboard";
import EXIF from "exif-js";
import GUI_tools_class from "../../core/gui/gui-tools";

// @ts-ignore
import semver_compare from "semver-compare";

let instance: File_open_class | null = null;

/** 
 * manages files / open
 * 
 * @author ViliusL
 */
class File_open_class {
	POP = new Dialog_class;
	Base_layers = new Base_layers_class;
	Base_gui = new Base_gui_class;
	Helper = new Helper_class;
	GUI_tools = new GUI_tools_class;
	Clipboard_class: Clipboard_class | undefined;
	SAVE_NAME: any;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		let _this = this;
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Helper = new Helper_class();
		this.GUI_tools = new GUI_tools_class();

		//clipboard class
		this.Clipboard_class = new Clipboard_class(function (data, w, h) {
			_this.on_paste(data, w, h);
		});

		this.events();

		this.maybe_file_open_url_handler();
	}

	events() {
		let _this = this;

		window.ondrop = function (e) {
			//drop
			e.preventDefault();
			_this.open_handler(e);
		};
		window.ondragover = function (e) {
			e.preventDefault();
		};
		document.addEventListener("keydown", (event) => {
			let code = event.key.toLowerCase();
			if (this.Helper.is_input(event.target))
				return;

			if (code == "o") {
				//open
				this.open_file();
				event.preventDefault();
			}
		}, false);
	}

	on_paste(data: string, width: number, height: number) {
		let new_layer = {
			name: "Paste",
			type: "image",
			data: data,
		};
		app.State?.do_action(
			new app.Actions.Insert_layer_action(new_layer as any)
		);
	}

	open_file() {
		let _this = this;

		alert("You can also drag and drop items into browser.");

		document.getElementById("tmp")!.innerHTML = "";
		let a = document.createElement("input")!;
		a.setAttribute("id", "file_open");
		a.type = "file";
		a.multiple = "multiple";
		document.getElementById("tmp")!.appendChild(a);
		document.getElementById("file_open")!.addEventListener("change", function (e) {
			_this.open_handler(e);
		}, false);

		//force click
		document.querySelector("#file_open")!.click();
	}
	
	open_webcam(){
		let _this = this;
		let video = document.createElement("video");
		video.autoplay = true;
		video.style.maxWidth = "100%";
		let track: { stop: () => void; } | null = null;
		
		function handleSuccess(stream: MediaProvider | null) {	
			track = stream.getTracks()[0];
			video.srcObject = stream;	
		}

		function handleError(error: any) {
			alert(`Sorry, cold not load getUserMedia() data: ${  error}`);
		}
		
		let settings = {
			title: "Webcam",
			params: [
				{title: "Stream:", html: "<div id=\"webcam_container\"></div>"},
			],
			on_load: function(params: any){
				document.getElementById("webcam_container")!.appendChild(video);
			},
			on_finish: function(params: any){
				//capture data
				let width = video.videoWidth;
				let height = video.videoHeight;
				
				let tmpCanvas = document.createElement("canvas");
				let tmpCanvasCtx = tmpCanvas.getContext("2d") as CanvasRenderingContext2D;
				tmpCanvas.width = width;
				tmpCanvas.height = height;
				tmpCanvasCtx.drawImage(video, 0, 0);
				
				//create requested layer
				let new_layer = {
					name: `Webcam #${  _this.Base_layers.auto_increment}`,
					type: "image",
					data: tmpCanvas.toDataURL("image/png"),
					width: width,
					height: height,
					width_original: width,
					height_original: height,
				};
				app.State?.do_action(
					new app.Actions.Bundle_action("open_file_webcam", "Open File Webcam", [
						new app.Actions.Insert_layer_action(new_layer as any),
						new app.Actions.Autoresize_canvas_action(width, height, undefined, true, true)
					])
				);
				
				//destroy
				if(track != null){
					track.stop();
				}
				video.pause();
				video.src = "";
				video.load();
			},
			on_cancel: function(params: any){
				if(track != null){
					track.stop();
				}
				video.pause();
				video.src = "";
				video.load();
			},
		};
		this.POP.show(settings as any);
		
		navigator.mediaDevices.getUserMedia({audio: false, video: true})
			.then(handleSuccess)
			.catch(handleError);
	}

	open_dir() {
		let _this = this;

		document.getElementById("tmp")!.innerHTML = "";
		let a = document.createElement("input");
		a.setAttribute("id", "file_open_dir");
		a.type = "file";
		a.webkitdirectory = "webkitdirectory";
		document.getElementById("tmp")!.appendChild(a);
		document.getElementById("file_open_dir")!.addEventListener("change", function (e) {
			_this.open_handler(e);
		}, false);

		//force click
		document.querySelector("#file_open_dir").click();
	}

	/**
	 * opens data URLs, like: "data:image/png;base64,xxxxxx"
	 * 
	 * data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAG0lEQVQYV2N89+7df0FBQQbG/////3///j0DAF9wCsg9spQfAAAAAElFTkSuQmCC
	 */
	open_data_url() {
		let _this = this;

		let settings = {
			title: "Open data URL",
			params: [
				{name: "data", title: "Data URL:", type: "textarea", value: ""},
			],
			on_finish: function (params: { data: any; }) {
				_this.file_open_data_url_handler(params.data);
			},
		};
		this.POP.show(settings as any);
	}

	file_open_data_url_handler(data: string) {
		let _this = this;
		if (data == "")
			return;

		let img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = function () {
			let new_layer = {
				name: "Data URL",
				type: "image",
				link: img,
				width: img.width,
				height: img.height,
				width_original: img.width,
				height_original: img.height,
			};
			app.State?.do_action(
				new app.Actions.Bundle_action("open_file_data_url", "Open File Data URL", [
					new app.Actions.Insert_layer_action(new_layer),
					new app.Actions.Autoresize_canvas_action(img.width, img.height, null, true, true)
				])
			);
			img.onload = function () {
				config.need_render = true;
			};
		};
		img.onerror = function (ex) {
			alert("Sorry, image could not be loaded. Try copy image and paste it.");
		};
		img.src = data;
	}

	open_url() {
		let _this = this;

		let settings = {
			title: "Open URL",
			params: [
				{name: "url", title: "URL:", value: ""},
			],
			on_finish: function (params: any) {
				_this.file_open_url_handler(params);
			},
		};
		this.POP.show(settings as any);
	}

	async open_handler(e: Event) {
		let _this = this;
		let files = e.target.files;

		let auto_increment = this.Base_layers.auto_increment;

		if (files == undefined) {
			//drag and drop
			files = e.dataTransfer.files;
		}

		//sort
		let orders = [];
		for (let i = 0, f; i < files.length; i++) {
			orders.push(files[i].name);
		}
		orders.sort();
		let order_map: never[] = [];
		for (let i in orders) {
			order_map[orders[i]] = parseInt(i);
		}

		//check if dropped directory
		let dir_opened = false;
		if (e.dataTransfer && e.dataTransfer.items)	{
			let items = e.dataTransfer.items;
			for (let i=0; i<items.length; i++) {
				let item = items[i].webkitGetAsEntry();
				if(item && item.isDirectory){
					dir_opened = true;
				}
			}
		}

		for (let i = 0, f; i < files.length; i++) {
			f = files[i];
			if (!f.type.match("image.*") && !f.name.match("on")) {
				if(dir_opened == false) {
					alert("Wrong file type, must be image or json.");
				}
				continue;
			}
			if (files.length == 1) {
				this.SAVE_NAME = f.name.split(".")[f.name.split(".").length - 2];
			}

			let FR = new FileReader();
			FR.file = files[i];

			FR.onload = function (event) {
				if (this.file.type.match("image.*")) {
					let order = auto_increment + order_map[this.file.name];
					//image
					let new_layer = {
						name: this.file.name,
						type: "image",
						data: event.target.result,
						order: order,
						_exif: _this.extract_exif(this.file)
					};
					app.State?.do_action(
						new app.Actions.Bundle_action("open_image", "Open Image", [
							new app.Actions.Insert_layer_action(new_layer)
						])
					);
				}
				else {
					//json
					let response = _this.load_json(event.target.result);
					if (response === true) {
						return false;
					}
				}
			};
			if (f.type == "text/plain")
				FR.readAsText(f);
			else if (f.name.match("on"))
				FR.readAsText(f);
			else
				FR.readAsDataURL(f);

			//sleep after last image import, it maybe not be finished yet
			await new Promise(r => setTimeout(r, 10));
		}

		//try to open dropped directory
		if (e.dataTransfer && e.dataTransfer.items)	{
			let items = e.dataTransfer.items;
			for (let i=0; i<items.length; i++) {
				let item = items[i].webkitGetAsEntry();
				if (item && item.isDirectory == true) {
					this.traverseFileTree(item);
				}
			}
		}
	}

	traverseFileTree(item: { isFile: any; file: (arg0: (file: any) => Promise<void>) => void; isDirectory: number; createReader: () => any; name: any; }, path: string | undefined) {
		let _this = this;
		let auto_increment = this.Base_layers.auto_increment;

		path = path || "";
		if (item.isFile) {
			item.file(async function(file: Blob) {
				let FR = new FileReader();
				FR.file = file;

				FR.onload = function (event) {
					if (this.file.type.match("image.*")
						//below is fix for firefox, it has empty type
						|| (this.file.type == "" && this.file.name.match(/\.(png|jpg|jpeg|webp|gif|avif)/g))) {
						//image
						let new_layer = {
							name: this.file.name,
							type: "image",
							data: event.target.result,
							_exif: _this.extract_exif(this.file)
						};
						app.State?.do_action(
							new app.Actions.Bundle_action("open_image", "Open Image", [
								new app.Actions.Insert_layer_action(new_layer)
							])
						);
					}
				};

				FR.readAsDataURL(file);

				//sleep after last image import, it maybe not be finished yet
				await new Promise(r => setTimeout(r, 10));

			});
		}
		else if (item.isDirectory) {
			// Get folder contents
			let dirReader = item.createReader();
			dirReader.readEntries(function(entries: string | any[]) {
				for (let i=0; i<entries.length; i++) {
					_this.traverseFileTree(entries[i], `${path + item.name  }/`);
				}
			});
		}
	}
	
	open_template_test(){
		let _this = this;

		this.Base_layers.debug_rendering = true;
		
		window.fetch("images/test-collectionon").then(function(response) {
			return responseon();
		}).then(function(json) {
			_this.load_json(json, false);
		}).catch(function(ex) {
			alert("Sorry, image could not be loaded.");
		});
	}

	/**
	 * check if url has url params, for example: https://viliusle.github.io/miniPaint/?image=http://i.imgur.com/ATda8Ae.jpg
	 */
	maybe_file_open_url_handler() {
		let _this = this;
		let url_params = this.Helper.get_url_parameters();

		if (url_params.image != undefined) {
			this.open_resource(url_params.image);
		}
	}

	/**
	 * includes provided resource (image or json)
	 *
	 * @param string resource_url
	 */
	open_resource(resource_url: RequestInfo | URL) {
		let _this = this;

		if(resource_url.toLowerCase().indexOf("on") == resource_url.length - 5){
			//load json
			window.fetch(resource_url).then(function(response) {
				return responseon();
			}).then(function(json) {
				_this.load_json(json, false);
			}).catch(function(ex) {
				alert("Sorry, image could not be loaded.");
			});
		}
		else{
			//load image
			let data = {
				url: resource_url,
			};
			this.file_open_url_handler(data);
		}
	}

	//handler for open url. Example url: http://i.imgur.com/ATda8Ae.jpg
	file_open_url_handler(user_response: { url: any; }) {
		let _this = this;
		let url = user_response.url;
		if (url == "")
			return;

		let layer_name = url.replace(/^.*[\\\/]/, "");

		let img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = function () {
			let new_layer = {
				name: layer_name,
				type: "image",
				link: img,
				width: img.width,
				height: img.height,
				width_original: img.width,
				height_original: img.height,
			};
			img.onload = function () {
				config.need_render = true;
			};
			app.State?.do_action(
				new app.Actions.Bundle_action("open_file_url", "Open File URL", [
					new app.Actions.Insert_layer_action(new_layer),
					new app.Actions.Autoresize_canvas_action(img.width, img.height, null, true, true)
				])
			);
		};
		img.onerror = function (ex) {
			alert("Sorry, image could not be loaded. Try copy image and paste it.");
		};
		img.src = url;
	}

	async load_json(data: string | ArrayBuffer | null) {
		let json;
		if(typeof data == "string")
			json = JSON.parse(data);
		else
			json = data;
		if (json.info.version == undefined) {
			json.info.version = "3.0.0";
		}

		//migration
		if(semver_compare(json.info.version, "4.0.0") < 0) {
			//convert from v3 to v4
			for (let i in json.layers) {
				//layers data
				json.layers[i].id = (parseInt(i) + 1);
				json.layers[i].opacity = json.layers[i].opacity * 100 || 100;
				json.layers[i].type = "image";
				json.layers[i].width = json.info.width;
				json.layers[i].height = json.info.height;
				json.layers[i].visible = (json.layers[i].visible == true); //convert to boolean
				delete json.layers[i].title;
			}
			json.data = [];
			for (let i in json.image_data) {
				//image data
				let new_id = null;
				for (let j in json.layers) {
					if (json.layers[j].name == json.image_data[i].name) {
						new_id = json.layers[j].id;
					}
				}
				if (new_id == null)
					continue;
				json.data.push(
					{
						id: new_id,
						data: json.image_data[i].data,
					}
				);
			}
		}
		if(semver_compare(json.info.version, "4.5.0") < 0) {
			//migrate "rectangle", "circle" and "line" types to "shape"
			for (let i in json.layers) {
				let old_type = json.layers[i].type;

				if(old_type == "line" && json.layers[i].params.type.value == "Arrow"){
					//migrate line (type=arrow) to arrow.
					json.layers[i].type = "arrow";
					delete json.layers[i].params.type;
					json.layers[i].render_function = ["arrow", "render"];
				}
				if(old_type == "rectangle" || old_type == "circle"){
					//migrate params
					json.layers[i].params.border_size = json.layers[i].params.size;
					delete json.layers[i].params.size;

					if(json.layers[i].params.fill == true) {
						json.layers[i].params.border = false;
					}
					else{
						json.layers[i].params.border = true;
					}
					json.layers[i].params.border_color = json.layers[i].color;
					json.layers[i].params.fill_color = json.layers[i].color;

					json.layers[i].color = null;
				}
				if(old_type == "circle"){
					//rename circle to ellipse
					json.layers[i].type = "ellipse";
					json.layers[i].render_function = ["ellipse", "render"];
				}
			}
		}
		if(semver_compare(json.info.version, "4.8.0") < 0) {
			//migrate "borders" layer to rectangle
			for (let i in json.layers) {
				let old_type = json.layers[i].type;

				if(old_type == "borders"){
					json.layers[i].type = "rectangle";
					json.layers[i].name += " (legacy)";
					json.layers[i].params = {
						radius: 0,
						fill: false,
						square: false,
						border_size: json.layers[i].params.size,
						border: true,
						border_color: json.layers[i].color,
						fill_color: "#000000",
					};
					json.layers[i].render_function = ["rectangle", "render"];
				}
			}
		}
		if(semver_compare(json.info.version, "4.11.0") < 0) {
			//migrate star and star24 objects
			for (let i in json.layers) {
				let old_type = json.layers[i].type;

				if(old_type == "star" && typeof json.layers[i].params.corners == "undefined"){
					json.layers[i].params.corners = 5;
					json.layers[i].params.inner_radius = 40;
					json.layers[i].render_function = ["star", "render"];
				}
				else if(old_type == "star24"){
					json.layers[i].type = "star";
					json.layers[i].params.corners = 24;
					json.layers[i].params.inner_radius = 80;
					json.layers[i].render_function = ["star", "render"];
				}
			}
		}

		const actions = [];

		//reset zoom
		await this.Base_gui.GUI_preview?.zoom(100); //reset zoom

		//set attributes
		actions.push(
			new app.Actions.Refresh_action_attributes_action("undo"),
			new app.Actions.Prepare_canvas_action("undo"),
			new app.Actions.Update_config_action({
				ZOOM: 1,
				WIDTH: parseInt(json.info.width),
				HEIGHT: parseInt(json.info.height),
				user_fonts: json.user_fonts || {}
			}),
			new app.Actions.Reset_layers_action(),
			new app.Actions.Prepare_canvas_action("do"),
			new app.Actions.Refresh_action_attributes_action("do")
		);

		let max_id_order = 0;
		for (let i in json.layers) {
			let value = json.layers[i];

			if(value.id > max_id_order)
				max_id_order = value.id;
			if(typeof value.order != undefined && value.order > max_id_order)
				max_id_order = value.order;

			if (value.type == "image") {
				//add image data
				value.link = null;
				for (let j in json.data) {
					if (json.data[j].id == value.id) {
						value.data = json.data[j].data;
					}
				}
			}
			actions.push(
				new app.Actions.Insert_layer_action(value, false)
			);
		}
		if (json.info.layer_active != undefined) {
			actions.push(
				new app.Actions.Select_layer_action(json.info.layer_active, true)
			);
		}
		if (json.info.guides != undefined) {
			config.guides = json.info.guides;
		}
		actions.push(
			new app.Actions.Set_object_property_action(this.Base_layers, "auto_increment", max_id_order + 1),
			new app.Actions.Update_config_action({
				WIDTH: parseInt(json.info.width),
				HEIGHT: parseInt(json.info.height),
			}),
			new app.Actions.Prepare_canvas_action("do")
		);
		await app.State?.do_action(
			new app.Actions.Bundle_action("open_json_file", "Open JSON File", actions)
		);
	}

	/**
	 * Returns an action that saves the exif data of the provided object to the current layer
	 */
	extract_exif(object: {
		name?: string;
		size?: number;
		type?: string;
		lastModified?: number;
	}) {
		let exif_data = {
			general: {
				Name: "",
				Size: "",
				Type: "",
				"Last modified": "",
			},
			exif: [],
		};

		//exif data
		EXIF.getData(object, function () {
			exif_data.exif = this.exifdata;
			delete this.exifdata.thumbnail;
		});

		//general
		if (object.name != undefined)
			exif_data.general.Name = object.name;
		if (object.size != undefined)
			exif_data.general.Size = `${this.Helper.number_format(object.size / 1000, 2)  } KB`;
		if (object.type != undefined)
			exif_data.general.Type = object.type;
		if (object.lastModified != undefined)
			exif_data.general["Last modified"] = this.Helper.format_time(object.lastModified);

		return exif_data;
	}

	search(){
		this.GUI_tools.activate_tool("media");
	}
}

export default File_open_class;

