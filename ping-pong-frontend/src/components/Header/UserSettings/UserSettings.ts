/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../../lang/dictionary";
import { LanguageSelector } from "../langSelector/langSelector";
import { isAuthenticated } from "../../../utils/auth";
import { setI18nData } from "../../../utils/i18n";
import { ThemeSelector } from "../../Theme/Theme";
import Component from "../../Component";

interface MenuListType {key: string, link: string, isAuth: boolean, component: HTMLElement | null};
export class UserSettings extends Component {
	profileDropdown: HTMLElement | null = null;
	avatar: HTMLElement | null = null;
	iconAuth: SVGSVGElement | null = null;
	iconUnauth: SVGSVGElement | null = null;
	menuList: MenuListType[] = [];

	constructor(parent: HTMLElement, dictionary: DictionaryType) {
		super('div', parent, dictionary);
		this.container.className = '';
		this.init();
	}
	initIcons(iconAuth: SVGSVGElement,iconUnauth: SVGSVGElement){
		iconUnauth.setAttributeNS(null, 'viewBox', '0 0 2048 2048');
		iconUnauth.setAttributeNS(null, 'width', '48');
		iconUnauth.setAttributeNS(null, 'height', '48');
		iconUnauth.innerHTML = '<defs><style>.fil5{fill:none}.fil2{fill:#d9d9da}</style></defs><g id="Layer_x0020_1"><path d="M1024 287.998h644.003c25.332 0 48.341 10.342 65 27 16.658 16.658 27 39.667 27 65v1288c0 25.332-10.342 48.341-27 65-16.659 16.658-39.668 27-65 27H1024v-1472z" style="fill:#919191"/><path d="M379.999 287.998H1024v1472H379.999c-25.332 0-48.341-10.342-65-27-16.658-16.658-27-39.667-27-65v-1288c0-25.332 10.342-48.341 27-65 16.659-16.658 39.668-27 65-27z" style="fill:#a4a4a5"/><path class="fil2" d="m1024 1311.58.394-.026c21.181-1.4 42.715-7.668 63.92-19.199 35.697-19.412 70.575-53.62 101.755-104.453l10.817-17.637 20.433 2.637c72.824 9.398 149.954 28.317 209.907 67.39 63.929 41.664 107.966 104.528 107.966 199.694 0 4.482-.35 9.185-1.057 14.1a96.875 96.875 0 0 1-3.041 13.802v.125c-25.955 87.142-166.501 137.89-335.954 156.786-55.977 6.242-115.455 9.23-174.966 9.093l-.174-.001v-322.31z"/><path d="M508.94 1450.25h-.124v-15.99l.751-6.375c38.204-186.626 114.774-204.895 232.945-233.086 22.368-5.335 46.384-11.066 69.875-18.004l24.677-7.289 12.324 22.663c23.506 43.224 53.309 75.836 86.268 96.051 23.728 14.555 49.054 22.65 74.696 23.555 4.529.16 9.08.096 13.648-.193v322.31c-50.75-.122-101.521-2.515-150.164-7.11-107.02-10.106-204.323-31.02-269.615-61.968-59.791-28.34-95.778-66.414-95.281-114.565z" style="fill:#e8e9e9"/><path d="m1024 451.095.981.409 3.82 1.587L1321.76 574.91c.445.184 4.023 1.71 7.38 3.14.895.38 1.587.679 6.09 2.559l66.175 27.645-64.8 30.73c-1.986.942-1.46.623-2.278 1.041v.126c-.43.218-.44.2-.546.264h-.125l-57.998 34.799c.256 22.144 1.708 47.934 3.903 73.834 2.705 31.934 6.375 63.15 10.25 87.64v.123c.242 1.551.61 2.928 1.108 4.186.463 1.168 1.251 2.571 2.355 4.237 8.037 12.11 12.427 20.053 15.234 30.543 2.718 10.158 3.027 19.094 3.027 33.748 0 12.106-1.409 23.193-3.787 34.072-2.256 10.32-5.263 19.947-8.705 29.958-7.441 21.645-16.849 29.501-27.19 38.136-2.536 2.12-5.213 4.356-7.647 7.422-7.612 44.657-45.529 100.391-92.829 143.967-44.83 41.3-99.58 73.28-146.934 76.697l-.443.031V451.095z" style="fill:#cacaca"/><path class="fil2" d="M1016.2 1240.08c-49.043 0-107.405-33.285-154.729-77.025-47.186-43.613-84.977-99.36-92.574-143.949-2.434-3.064-5.11-5.3-7.647-7.42-10.342-8.635-19.747-16.49-27.188-38.136-3.442-10.01-6.449-19.637-8.705-29.957-2.379-10.88-3.788-21.966-3.788-34.073 0-14.654.31-23.59 3.027-33.747 2.808-10.491 7.2-18.433 15.233-30.544 1.105-1.665 1.892-3.068 2.355-4.236.5-1.26.867-2.638 1.11-4.186v-.124c3.875-24.49 7.544-55.706 10.25-87.64 2.195-25.9 3.646-51.69 3.903-73.834l-47.567-28.54-.31 86.926c11.604 4.199 19.908 15.387 19.908 28.413 0 8.326-3.44 15.908-8.906 21.374 5.293 17.733 13.042 54.796-2.931 83.4-4.62 8.223-12.526 14.119-21.867 16.202-9.255 2.202-18.92.18-26.646-5.286l-4.215-3.012c-8.137-5.813-13.286-15.045-13.865-25.058-.665-10.008 3.185-19.76 10.592-26.575 9.168-8.577 16.807-20.513 19.088-37.064-7.14-5.56-11.686-14.211-11.686-23.981 0-13.112 8.397-24.3 20.084-28.413l.419-97.912-57.865-27.442 66.194-27.637c4.41-1.84 5.16-2.162 6.096-2.561 3.387-1.445 6.675-2.847 7.375-3.138l292.958-121.818 12.251-5.092 7.448 3.096v788.712c-2.624.18-5.226.277-7.802.277z"/><path class="fil5" d="M255.999 255.999h1536v1536h-1536z"/><path class="fil5" d="M0 0h2048v2048H0z"/></g>';

		iconAuth.setAttributeNS(null, 'viewBox', '0 0 48 48');
		iconAuth.setAttributeNS(null, 'width', '48');
		iconAuth.setAttributeNS(null, 'height', '48');
		iconAuth.innerHTML = `<defs><style>.cls-3{fill:#6fabe6}.cls-4{fill:#82bcf4}</style></defs><g id="User_profile" data-name="User profile"><path d="M47 24A23 23 0 1 1 12.81 3.91 23 23 0 0 1 47 24z" style="fill:#374f68"/><path d="M47 24a22.91 22.91 0 0 1-8.81 18.09A22.88 22.88 0 0 1 27 45C5.28 45-4.37 17.34 12.81 3.91A23 23 0 0 1 47 24z" style="fill:var(--color-accent2)"/><path class="cls-3" d="M39.2 35.39a19 19 0 0 1-30.4 0 17 17 0 0 1 10.49-8.73 8.93 8.93 0 0 0 9.42 0 17 17 0 0 1 10.49 8.73z"/><path class="cls-4" d="M39.2 35.39a19 19 0 0 1-4.77 4.49 19 19 0 0 1-15.13-1 7.08 7.08 0 0 1-.51-12.18c.1-.07 0-.05.5-.05a9 9 0 0 0 9.42 0 17 17 0 0 1 10.49 8.74z"/><path class="cls-3" d="M33 19a9 9 0 1 1-12.38-8.34A9 9 0 0 1 33 19z"/><path class="cls-4" d="M33 19a9 9 0 0 1-2.6 6.33c-9.13 3.74-16.59-7.86-9.78-14.67A9 9 0 0 1 33 19z"/></g>`;

	}
	initDropdownMenu(){
		if (!this.profileDropdown)
			return ;
		this.profileDropdown.className = 'z-2 dropdown-menu absolute right-2 hidden bg-(--color-form-base) text-(--color-text-form) rounded-b-lg pb-7 pt-3 w-48';
		const isAuth = isAuthenticated();

		this.menuList.forEach((item) => {
			item.component = document.createElement('a');
			item.component.className = 'block px-6 py-2 hover:bg-(--color-form-accent) hover:text-(--color-text-form)';
			if ( isAuth && !item.isAuth || !isAuth && item.isAuth ) {
				item.component.classList.add('hidden');
			}
			item.component.setAttribute('href', item.link);
			setI18nData(item.component, this.dictionary[this.dictionary.currLang], "header", item.key);
			this.profileDropdown?.appendChild(item.component);
		});
		LanguageSelector(this.profileDropdown, this.dictionary);
		ThemeSelector(this.profileDropdown);
	}
	profileDropDownHandler = () => {
		this.profileDropdown?.classList.toggle('hidden');
		console.log(this.avatar, this.profileDropdown);

	}
	createChildren(): void {
		this.menuList = [
			{"key": "login", "link": "/login", "isAuth": false, "component": null},
			{"key": "signup", "link": "/signup", "isAuth": false, "component": null},
			{"key": "logout", "link": "/logout", "isAuth": true, "component": null},
			{"key": "profile", "link": "/profile", "isAuth": true, "component": null},
			{"key": "game", "link": "/game", "isAuth": false, "component": null}
		];
		this.avatar = document.createElement('div');
		// console.log('crete children	', this, this.avatar);
		this.avatar.className = 'dropdown-toggle inline-flex items-center justify-center w-12 h-12 text-xl text-white bg-indigo-500 rounded-full';
		this.container.appendChild(this.avatar);
		this.profileDropdown = document.createElement('div');
		this.iconAuth = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this.iconUnauth =document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		this.initIcons(this.iconAuth, this.iconUnauth);
		this.initDropdownMenu();
		this.avatar.addEventListener('click', this.profileDropDownHandler);
		this.container.appendChild(this.profileDropdown);
		window.addEventListener('click', (e) => {
			if ( e.target && !(e.target as Element).closest('.dropdown-toggle') && !(e.target as Element).closest('.dropdown-menu')) {
				this.profileDropdown?.classList.add('hidden');
			}
		});
	}
	addSubscriptions(): void {
	}
	removeSubscriptions(): void {

	}
	destroy(){}
	render(){
		if (isAuthenticated() && this.iconAuth) {
			this.avatar?.appendChild(this.iconAuth);
		} else if (this.iconUnauth) {
			this.avatar?.appendChild(this.iconUnauth);
		}
		if (this.parent)
			this.parent.appendChild(this.container);
	}
}
