// @ts-nocheck
import config from "../../config";
import Helper_class from "../../libs/helpers";
import Translate_class from "../../libs/jquery.translate";

let instance: Tools_translate_class | null = null;

class Tools_translate_class {
  private Helper: Helper_class = new Helper_class;
  private trans_lang_codes: any;
  private translations: object | undefined;

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.translations = {};
		this.trans_lang_codes = [];

		this.load_translations();
	}

	//change language
	translate(lang_code: string | undefined, element?: undefined) {
		if (lang_code == undefined) {
			lang_code = this.Helper.getCookie("language");
			if (!lang_code) {
				return;
			}
		}

		if (lang_code != undefined && lang_code != config.LANG) {
			//save cookie
			this.Helper?.setCookie("language", lang_code);
		}

		if (this.trans_lang_codes.includes(lang_code) || lang_code == "en") {
			//translate
			$(element || "body").translate({lang: lang_code, t: this.translations});
			config.LANG = lang_code;
		}
		else {
			alert(`Translate error, can not find dictionary: ${  lang_code}`);
		}
	}

	load_translations() {
		let _this = this;
		let modules_context = require.context("./../../languages/", true, /\on$/);
		modules_context.keys().forEach(function (key: string) {
			if (key.indexOf("Base" + "/") < 0 && key.indexOf("empty") < 0) {
				let moduleKey = key.replace("./", "").replace("on", "");
				let classObj = modules_context(key);
				
				for(let i in classObj){
					if(_this.translations[i] == undefined){
						_this.translations[i] =	{
							en: i,
						};
					}
					_this.translations[i][moduleKey] = classObj[i];
				}
				_this.trans_lang_codes.push(moduleKey);
			}
		});
	}
}

export default Tools_translate_class;
