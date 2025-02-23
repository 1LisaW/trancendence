import { Header } from "../../components/Header/Header";
import { DictionaryType } from "../../lang/dictionary";
import Component from "../../components/Component";
import Footer from "../../components/Footer/Footer";
import Main from "../Main/Main";
import Login from "../Login/Login";
import SignUp from "../SignUp/SignUp";
import Game from "../Game/Game";

class Router {
	routes: Record<string, string[]> = {
		'/': ['header', 'main', 'footer'],
		'/login': ['login'],
		'/signup': ['signup'],
		'/profile': ['header', 'profile', 'footer'],
		// '/game': ['header', 'game', 'footer'],
		'/game': ['game']

	}
	currentRoute = '/';
	constructor() {
		this.currentRoute = window.location.pathname;
		console.log(this.currentRoute);
		if (!(this.currentRoute in this.routes)) {
			this.currentRoute = '/';
		}
		console.log('Router created');
	}
	getCurrentRoute() {
		return this.currentRoute;
	}
	getRouteOutlets() {
		return this.routes[location.pathname] || [];
	}
	navigateTo = (link: string) => {
		history.pushState(null, "", link);
		console.log("history was changed", link);
	}

}
type OutletKeysType = 'header' | 'footer' | 'signup' | 'login' | 'game' | 'main' | 'profile'
interface AppliedOutlets {
	'key': OutletKeysType,
	'component': InstanceType<typeof Component>
}

export class SPA {
	parent: HTMLElement;
	dictionary: DictionaryType;
	container: HTMLElement;
	router: Router = new Router();
	outlets: Record<string, InstanceType<typeof Component> | null> = {
		"header": null, "main": null, "footer": null, "login": null, "signup": null, "game": null
	};
	appliedOutlets: AppliedOutlets[] = [];
	constructor(parent: HTMLElement, dictionary: DictionaryType) {
		this.parent = parent;
		this.dictionary = dictionary;
		this.container = parent;
		this.container.classList.add("h-[100%]", "w-[100%]" , "flex", "flex-col", "bg-(--color-paper-base)");

		this.update();
		this.initSubscriptions();
	}
	initSubscriptions(){
		this.container.addEventListener("click", (e) => {
			// e.preventDefault()
		const anchor = (e.target as Element).closest('a') as HTMLAnchorElement;
		if (anchor) {
			e.preventDefault();
			this.router.navigateTo(anchor.href);
			this.router.currentRoute = location.pathname;
			this.update();
		}
		});
	}
	initOutlet(outletName: string){
		switch (outletName) {
			case "header":
				this.outlets["header"] = new Header('nav', this.container, this.dictionary);
				break;
			case "login":
				this.outlets["login"] = new Login("div",this.container, this.dictionary);
				break;
			case "signup":
				this.outlets["signup"] = new SignUp("div",this.container, this.dictionary, this.navigate);
				break;
			case "footer":
				this.outlets["footer"] = new Footer("footer",this.container, this.dictionary);
				break;
			case "main":
				this.outlets["main"] = new Main("div",this.container, this.dictionary);
				break;
			case "game":
				this.outlets["game"] = new Game("div",this.container, this.dictionary);
				break;
			default:
				break;
		}
	}
	navigate = (route: string) => {
		this.router.navigateTo(route);
		this.router.currentRoute = location.pathname;
		this.update();
	}
	update = () => {
		// console.log("appliedOtlets ", this.appliedOutlets);
		this.appliedOutlets.forEach((component) => component.component.removeFromDOM());
		this.appliedOutlets = [];
		const currentOutlets = this.router.getRouteOutlets();
		console.log(currentOutlets);
		currentOutlets.forEach((value) => {
			if (!this.outlets[value])
				this.initOutlet(value);
			else
			{
				this.outlets[value].addToDOM(null);
			}
			if (this.outlets[value] )
				this.appliedOutlets.push({key: value as OutletKeysType, component: this.outlets[value]});
		})
	}
}

