/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import Component from "../../components/Component";
import App from "./App/App";

export default class Game extends Component {
	app: App | null = null;
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType)
	{
		super(tag, parent, dictionary);
		this.container.className = "bg-(--color-paper-base) h-full relative w-screen overflow-hidden";
		this.init();
	}
	createChildren(): void {
		const div = document.createElement('div');
		div.className = "max-w-[1300px] flex flex-col justify-center h-full w-screen m-auto rotate-90 lg:rotate-0";
		this.app = new App();
		this.app.appendTo(div);

		this.container.appendChild(div);
	}
	addSubscriptions(): void {

	}
	removeSubscriptions(): void {

	}
	render(): void {

	}

	// handleJoinTournamentMatch = (opponent = "") => {
	// 	this.setGameMode('tournament', opponent);
	// }

	setGameMode = (mode: 'pvp' | 'pvc' | 'tournament'| null, opponent = "", opponentId = 0, isInitiator= false) => {
		if (!this.app)
			return
		this.app.setGameMode(mode, opponent, opponentId, isInitiator);
	}

	updateGameSockets = (isAuth: boolean) => {
		if (!this.app)
			return;
		this.app.updateSocket(isAuth);
	}
}
