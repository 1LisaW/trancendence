import { Header } from "../../components/Header/Header";
import { DictionaryType } from "../../lang/dictionary";
import Component from "../../components/Component";
import Footer from "../../components/Footer/Footer";
import Main from "../Main/Main";
import Login from "../Login/Login";
import SignUp from "../SignUp/SignUp";
import Game from "../Game/Game";
import { getProfileAvatar, isAuthenticated, removeToken } from "../../utils/auth";
import Profile from "../Profile/Profile";
import Chat from "../../components/Chat/Chat";
import Chat_WS from "./Chat_WS";
import { ChatTournamentMessage, ChatTournamentReply } from "../../model/Chat";

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
	isAuth = false;

	chat_ws: Chat_WS;

	avatar = '';

	chat: Chat;

	constructor(parent: HTMLElement, dictionary: DictionaryType) {
		this.parent = parent;
		this.dictionary = dictionary;
		this.container = parent;
		this.container.classList.add("h-[100%]", "w-[100%]" , "flex", "flex-col", "bg-(--color-paper-base)");
		this.chat_ws = new Chat_WS(this.syncChatFromWs);
		this.chat = new Chat(this.syncWsFromChat);

		this.update().then(()=>{
			this.initSubscriptions();
		});
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
				this.outlets["header"] = new Header('nav', this.container, this.dictionary, this.getIsAuth, this.navigate, this.avatar);
				break;
			case "login":
				this.outlets["login"] = new Login("div",this.container, this.dictionary, this.navigate);
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
			case "profile":
				this.outlets["profile"] = new Profile("div",this.container, this.dictionary, this.avatar, this.updateAvatar);
				break;
			default:
				break;
		}
	}
	navigate = async (route: string) => {
		// if (route === '/game' && this.isAuth == false)
		// 	route ='/login';
		this.router.navigateTo(route);
		this.router.currentRoute = location.pathname;
		await this.update();
	}
	getIsAuth = () => {
		return (this.isAuth);
	}

	updateAvatar = async () => {
		this.avatar = await getProfileAvatar();
		this.outlets["profile"]?.update(this.avatar);
		this.outlets["header"]?.update(this.avatar);
	}

	syncChatFromWs = (data: ChatTournamentMessage) => {
		if (data.recipient === 'tournament' && data.event === 'match') {
			this.navigate('/game');
			location.pathname = '/game';
			console.log('syncWsFromChat navigate to game ', data);
		}
		else {
		console.log('syncChatFromWs', data);
		this.chat.update(data);
		}
	}

	syncWsFromChat = (data: ChatTournamentReply) => {
			this.chat_ws.send(JSON.stringify(data));
	}

	// joinTournament =  () => {
	// 	if (!this.chat_ws)
	// 		return ;
	// 	this.chat_ws.send(JSON.stringify({ recipient: 'tournament', event: 'join'}));
	// }

	// acceptTournamentMatch =  (reply: boolean) => {
	// 	if (!this.chat_ws)
	// 		return ;
	// 	this.chat_ws.send(JSON.stringify({recipient: 'tournament', event: 'match', accept: reply}));
	// }

	// init_chat_ws = () => {
	// 	if (this.chat_ws)
	// 		return ;
	// 	this.chat_ws = new WebSocket('/api/session-management/ws/chat', getToken());
	// 	this.chat_ws.onopen = () => console.log('WebSocket is connected!')
	// 	// 4
	// 	this.chat_ws.onmessage = (msg) => {
	// 	const message = msg.data
	// 	console.log('I got a message!', message)
	// 	//   message.innerHTML += `<br /> ${message}`
	// 	}
	// 	// 5
	// 	this.chat_ws.onerror = (error) => console.log('WebSocket error', error)
	// 	// 6
	// 	this.chat_ws.onclose = () => console.log('Disconnected from the WebSocket server')
	// }
	// close_chat_ws = () => {
	// 	if (!this.chat_ws)
	// 		return ;
	// 	this.chat_ws.close();
	// 	this.chat_ws = null;
	// }
	checkIsAuth = async () => {
		const isAuth = (await isAuthenticated());
		if (this.isAuth === isAuth)
		{
			return ;
		}
		this.isAuth = isAuth;
		if (this.isAuth)
		{
			// this.init_chat_ws();
			this.chat_ws.init();
			if (this.chat.container)
				this.container.appendChild(this.chat.container);
			// this.outlets["header"]?.;
		}
		else
		{
			if (this.chat.container)
			{
				this.chat.clear();
				this.container.removeChild(this.chat.container);
			}
			removeToken();
			// this.close_chat_ws();
			this.chat_ws.close();
			this.avatar = '';
		}
		this.updateAvatar();

	}
	update = async() => {
		await this.checkIsAuth();
		// this.isAuth = !!(userName);
		this.outlets["header"]?.update();
		if (!this.isAuth)
		{
			// removeToken();
			// this.close_chat_ws();
			console.log('location.pathname ',location.pathname);
			if (location.pathname === '/game')
			{
				this.navigate('/login');
				location.pathname = '/login';
				return ;
			}
		}
		this.appliedOutlets.forEach((component) => component.component.removeFromDOM());
		this.appliedOutlets = [];
		const currentOutlets = this.router.getRouteOutlets();
		console.log(currentOutlets);
		currentOutlets.forEach((value) => {
			// Simona - Force recreation of Profile component when user changes
			if (value === 'profile' && this.outlets[value]) {
				this.outlets[value] = null; // Simona - Force recreation
			}
			
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

