export default class Avatar {
	container: HTMLElement;
	constructor(parent: HTMLElement) {
		this.container = document.createElement('div');
		parent.appendChild(this.container);
	}
}
