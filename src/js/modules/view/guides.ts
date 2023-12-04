import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";
import Helper_class from "../../libs/helpers.js";
import Base_layers_class from "../../core/base-layers.js";
import alertify from "alertifyjs/build/alertify.min.js";
import Tools_settings_class from "../tools/settings.js";
import app from "../../app.js";

class View_guides_class {
	POP: Dialog_class;
	Base_layers: Base_layers_class;
	Tools_settings: Tools_settings_class;
	Helper: Helper_class;


	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Tools_settings = new Tools_settings_class();
		this.Helper = new Helper_class();
	}

	insert() {
		let _this = this;
		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		//convert units
		let position = 20;
		let position = this.Helper.get_user_unit(position, units, resolution);

		let settings = {
			title: "Insert guides",
			params: [
				{name: "type", title: "Type:", values: ["Vertical", "Horizontal"], value :"Vertical"},
				{name: "position", title: "Position:",  value: position},
			],
			on_finish: function (params: any) {
				_this.insert_handler(params);
			},
		};
		this.POP.show(settings);
	}

	insert_handler(data: { type: any; position: string; }){
		let type = data.type;
		let position = parseFloat(data.position);
		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		//convert units
		position = this.Helper.get_internal_unit(position, units, resolution);

		let x = null;
		let y = null;
		if(type == "Vertical")
			x = position;
		if(type == "Horizontal")
			y = position;

		//update
		config.guides.push({x: x, y: y});

		if(config.guides_enabled == false){
			//was disabled
			config.guides_enabled = true;
			this.Helper.setCookie("guides", 1);
			alertify.warning("Guides enabled.");
		}

		config.need_render = true;
	}

	update(){
		let _this = this;
		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		let params = [];
		for(let i in config.guides){
			let guide = config.guides[i];

			//convert units
			let value = guide.x;
			let value = this.Helper.get_user_unit(value, units, resolution);

			if(guide.y === null) {
				params.push({name: i, title: "Vertical:", value: value});
			}
		}
		for(let i in config.guides){
			let guide = config.guides[i];

			//convert units
			let value = guide.y;
			let value = this.Helper.get_user_unit(value, units, resolution);

			if(guide.x === null) {
				params.push({name: i, title: "Horizontal:", value: value});
			}
		}

		let settings = {
			title: "Update guides",
			params: params,
			on_finish: function (params: any) {
				_this.update_handler(params);
			},
		};
		this.POP.show(settings);
	}

	update_handler(data: { [x: string]: string; }){
		let units = this.Tools_settings.get_setting("default_units");
		let resolution = this.Tools_settings.get_setting("resolution");

		//update
		for (let i in data) {
			let key = parseInt(i);
			let value = parseFloat(data[i]);

			//convert units
			value = this.Helper.get_internal_unit(value, units, resolution);

			if (config.guides[key].x === null)
				config.guides[key].y = value;
			else
				config.guides[key].x = value;
		}

		//remove empty
		for (let i = 0; i < config.guides.length; i++) {
			if(config.guides[i].x === 0 || config.guides[i].y === 0
				|| isNaN(config.guides[i].x) || isNaN( config.guides[i].y)){
				config.guides.splice(i, 1);
				i--;
			}
		}

		config.need_render = true;
	}

	remove(params: any) {
		config.guides = [];
		config.need_render = true;
	}

}

export default View_guides_class;