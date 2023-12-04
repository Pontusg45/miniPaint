/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from "../config.js";
import Dialog_class from "../libs/popup.js";
import Base_gui_class from "./base-gui.js";
import fuzzysort from "fuzzysort";

let instance: Base_search_class | null = null;

class Base_search_class {

	POP: Dialog_class = new Dialog_class();
	Base_gui: Base_gui_class = new Base_gui_class();
	db: any = null;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.POP = new Dialog_class();
		this.Base_gui = new Base_gui_class();
		this.db = null;

		this.events();
	}

	events() {
		document.addEventListener("keydown", (event) => {
			if (this.POP.get_active_instances() > 0) {
				return;
			}

			let code = event.key;
			if (code == "F3" || ( (event.ctrlKey == true || event.metaKey) && code == "f")) {
				//open
				this.search();
				event.preventDefault();
			}
		}, false);

		document.addEventListener("input", (event) => {
			if(document.querySelector("#pop_data_search") == null){
				return;
			}

			let node = document.querySelector("#global_search_results");
			if (node == null) {
				throw new Error("Node not found");
			}
			node.innerHTML = "";

			if(event.target == null){
				return;
			}

			let query = event.target.value;
			if(query == ""){
				return;
			}

			let results = fuzzysort.go(query, this.db, {
				keys: ["title"],
				limit: 10,
				threshold: -50000,
			});

			//show
			for(let i = 0; i < results.length; i++) {
				let item = results[i];

				let className = `search-result n${  i+1}`;
				if(i == 0){
					className += " active";
				}

				node.innerHTML += `<div class='${className}' data-key='${item.obj.key}'>${
					 fuzzysort.highlight(item[0])  }</div>`;
			}
		}, false);

		//allow to select with arrow keys
		document.addEventListener("keydown", function (e) {
			
			if(document.querySelector("#global_search_results") == null
				|| document.querySelector(".search-result") == null){
				return;
			}
			let k = e.key;

			if (k == "ArrowUp") {
				let target = document.querySelector(".search-result.active");
				if(target == null){
					return;
				}
				let index = Array.from(target.parentNode.children).indexOf(target);
				if(index > 0){
					index--;
				}
				target?.classList.remove("active");
				let target2 = document.querySelector("#global_search_results")?.childNodes[index];
				target2?.classList.add("active");
				e.preventDefault();
			}
			else if (k == "ArrowDown") {
				let target = document.querySelector(".search-result.active");
				let index = Array.from(target.parentNode.children).indexOf(target);
				let total = target?.parentNode?.childElementCount;
				if(total && index < total - 1){
					index++;
				}
				target?.classList.remove("active");
				let target2 = document.querySelector("#global_search_results")?.childNodes[index];
				target2?.classList.add("active");
				e.preventDefault();
			}

		}, false);
	}

	search() {
		let _this = this;

		//init DB
		if(this.db === null) {
			this.db = Object.keys(this.Base_gui.modules);
			for(let i in this.db){
				this.db[i] = {
					key: this.db[i],
					title: this.db[i].replace(/_/i, " "),
				};
			}
		}

		let settings = {
			title: "Search",
			params: [
				{name: "search", title: "Search:", value: ""},
			],
			on_load: function (params: any, popup: { el: { querySelector: (arg0: string) => { (): any; new(): any; appendChild: { (arg0: HTMLDivElement): void; new(): any; }; }; }; }) {
				let node = document.createElement("div");
				node.id = "global_search_results";
				node.innerHTML = "";
				popup.el.querySelector(".dialog_content").appendChild(node);
			},
			on_finish: function (params: any) {
				//execute
				const target = document.querySelector(".search-result.active");
				if(target){
					//execute
					const key = target.dataset.key;
					const class_object = this.Base_gui.modules[key];
					const function_name = _this.get_function_from_path(key);

					_this.POP.hide();
					class_object[function_name]();
				}
			},
		};
		this.POP.show(settings);

		//on input change
		(document?.getElementById("pop_data_search") as HTMLInputElement).select();
	}

	get_function_from_path(path: string){
		const parts = path.split("/");
		let result = parts[parts.length - 1];
		result = result.replace(/-/, "_");

		return result;
	}

}

export default Base_search_class;
