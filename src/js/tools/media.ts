// @ts-nocheck
import config from "../config";
import Base_tools_class from "../core/base-tools";
import File_open_class from "../modules/file/open";
import Tools_settings_class from "../modules/tools/settings";
import Dialog_class from "../libs/popup";

class Media_class extends Base_tools_class {
  private File_open: File_open_class;
  private Tools_settings: Tools_settings_class;
  private POP: Dialog_class;
  private cache: any[];
  private page: number;
  private per_page: number;

	constructor(ctx: number) {
		super();
		this.File_open = new File_open_class();
		this.Tools_settings = new Tools_settings_class();
		this.POP = new Dialog_class();
		this.name = "media";
		this.cache = [];
		this.page = 1;
		this.per_page = 50;
	}

	load() {
		//nothing
	}

	render(ctx: CanvasRenderingContext2D, layer: any) {
		//nothing
	}

	on_activate() {
		this.search();
	}

	/**
	 * Image search api
	 *
	 * @param {string} query
	 * @param {array} data
	 * @param pages
	 */
	search(query = "", data = [], pages = null) {
		let _this = this;
		let html = "";
		let html_paging = "";

		let key = config.pixabay_key;
		key = key.split("").reverse().join("");

		let safe_search = this.Tools_settings.get_setting("safe_search");

		if (data.length > 0) {
			for (let i in data) {
				html += "<div class=\"item\">";
				html += `	<img class="displayBlock pointer" alt="" src="${  data[i].previewURL  }" data-url="${  data[i].webformatURL  }" />`;
				html += "</div>";
			}
			//fix for last line
			html += "<div class=\"item\"></div>";
			html += "<div class=\"item\"></div>";
			html += "<div class=\"item\"></div>";
			html += "<div class=\"item\"></div>";

			//paging
			html_paging += "<div class=\"media-paging\" id=\"media_paging\">";
			html_paging += "<button type=\"button\" data-value=\"1\" title=\"Previous\">&lt;</button> ";
			for(let i = 1; i <= Math.min(10, pages); i++) {
				let selected = "";
				if(this.page == i){
					let selected = "selected";
				}
				html_paging += `<button type="button" class="${selected}" data-value="${i}">${i}</button> `;
			}
			html_paging += `<button type="button" data-value="${Math.min(this.page + 1, pages)}" title="Next">&gt;</button> `;
			html_paging += "</div>";
		}
		else{
			this.page = 1;
		}

		let settings = {
			title: "Search",
			//comment: 'Source: <a class="text_muted" href="https://pixabay.com/">pixabay.com</a>.',
			className: "wide",
			params: [
				{name: "query", title: "Keyword:", value: query},
			],
			on_load: function (params: any, popup: { el: { querySelector: (arg0: string) => { (): any; new(): any; appendChild: { (arg0: HTMLDivElement): void; new(): any; }; }; querySelectorAll: (arg0: string) => any; }; }) {
				let node = document.createElement("div");
				node.classList.add("flex-container");
				node.innerHTML = html + html_paging;
				popup.el.querySelector(".dialog_content").appendChild(node);
				//events
				let targets = popup.el.querySelectorAll(".item img");
				for (let i = 0; i < targets.length; i++) {
					targets[i].addEventListener("click", function (event: any) {
						//we have click
						let data = {
							url: this.dataset.url,
						};
						_this.File_open.file_open_url_handler(data);
						_this.POP.hide();
					});
				}
				let targets = popup.el.querySelectorAll("#media_paging button");
				for (let i = 0; i < targets.length; i++) {
					targets[i].addEventListener("click", function (event: any) {
						//we have click
						_this.page = parseInt(this.dataset.value);
						_this.POP.save();
					});
				}
			},
			on_finish: function (params: { query: number | boolean | undefined; }) {
				if (params.query == "")
					return;

				let URL = `https://pixabay.com/api/?key=${  key
					 }&page=${  _this.page
					 }&per_page=${  _this.per_page
					 }&safesearch=${  safe_search
					 }&q=${	 encodeURIComponent(params.query)}`;

				if (_this.cache[URL] != undefined) {
					//using cache

					setTimeout(function () {
						//only call same function after all handlers finishes
						let data = _this.cache[URL];

						if (parseInt(data.totalHits) == 0) {
							alert("Your search did not match any images.");
						}

						let pages = Math.ceil(data.totalHits / _this.per_page);
						_this.search(params.query, data.hits, pages);
					}, 100);
				}
				else {
					//query to service
					$.getJSON(URL, function (data) {
						_this.cache[URL] = data;

						if (parseInt(data.totalHits) == 0) {
							alert("Your search did not match any images.");
						}

						let pages = Math.ceil(data.totalHits / _this.per_page);
						_this.search(params.query, data.hits, pages);
					})
					.fail(function () {
						alert("Error connecting to service.");
					});
				}
			},
		};
		this.POP.show(settings as any);
	}
}

export default Media_class;
