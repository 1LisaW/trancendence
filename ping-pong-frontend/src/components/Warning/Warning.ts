import { DictionaryLanguage } from "../../lang/dictionary"
import { setI18nData } from "../../utils/i18n"

export default class Warning {
	parent: HTMLElement;
	container: HTMLElement;
	constructor(parent: HTMLElement, dictionary: DictionaryLanguage, message_key:string) {
		this.parent = parent
		this.container = document.createElement('div');
		this.render(parent, dictionary, message_key);
	}
	render(parent: HTMLElement, dictionary: DictionaryLanguage, message_key:string){

		this.container.className = "flex items-center p-4 mb-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800";
		this.container.setAttribute('role', "alert");
		parent.appendChild(this.container);

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.classList.add('shrink-0', 'inline', 'w-4', 'h-4', 'me-3');
		svg.setAttributeNS(null, 'viewBox', '0 0 20 20');
		svg.setAttributeNS(null, 'aria-hidden', "true");

		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttributeNS(null, 'd', 'M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z');
		svg.appendChild(path);
		this.container.appendChild(svg);

		const div = document.createElement('div');
		setI18nData(div, dictionary, 'validation', 'warning');
		const span = document.createElement('span');
		span.className ='font-medium';
		setI18nData(span, dictionary, 'validation', message_key);
		div.append(span);
		this.container.append(div);
	}
	removeFromDom(){
		this.parent.removeChild(this.container);
	}
}
