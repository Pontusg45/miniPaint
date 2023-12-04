import config from "../../config.js";
import Dialog_class from "../../libs/popup.js";

class Help_about_class {

	POP: Dialog_class;

	constructor() {
		this.POP = new Dialog_class();
	}

	//about
	about() {
		const email = "www.viliusl@gmail.com";

		const settings = {
			title: "About",
			params: [
				{ title: "", html: "<img style=\"width:64px;\" class=\"about-logo\" alt=\"\" src=\"images/logo-colors.png\" />" },
				{ title: "Name:", html: "<span class=\"about-name\">miniPaint</span>" },
				{ title: "Version:", value: "1.3.1" },
				{ title: "Description:", value: "Online image editor." },
				{ title: "Author:", value: "ViliusL" },
				{ title: "Email:", html: `<a href="mailto:${email}">${email}</a>` },
				{ title: "GitHub:", html: "<a href=\"https://github.com/viliusle/miniPaint\">https://github.com/viliusle/miniPaint</a>" },
				{ title: "Website:", html: "<a href=\"https://viliusle.github.io/miniPaint/\">https://viliusle.github.io/miniPaint/</a>" },
			],
		};
		this.POP.show(settings);
	}
}


export default Help_about_class;
