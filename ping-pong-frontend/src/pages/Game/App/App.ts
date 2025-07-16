import "@babylonjs/inspector";
import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, Color4, FreeCamera, EngineFactory, Mesh, Animation } from "@babylonjs/core";
import earcut from 'earcut';
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button, Image, Rectangle, TextBlock } from "@babylonjs/gui";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Environment from "./Environment";
import { getToken } from "../../../utils/auth";


export enum MatchOptions {
	START,
	FORFEIT,
	TECHNICAL_WIN,
	WIN,
	LOSE,
	DRAW
}

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3, WAITING = 4 }

const defaultAvatar = "data:image/jpeg;base64,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D7RXJDW/s16NLya/urs/dTP4avZ8J/X4rVitwAAAAAAAAAAAAAAAAAAAAABheVWrTpunzatVbX8jeijbriO2f/va18yfKLUZ1LVLt2mre1bn0dv+WO35zvLGNRmgCoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMxO8TtMNicmtX/tXAj0tW+RZ2oue/2VfP8AXdrtkdC1OrStRt5EzPoqvUux7aZ8utKsbKHETFURVTMTE8YmHLLQAAAAAAAAAAAAAAAAAAx2v5s4Gk5F+mdq5p5lHxnh/wA/JkUvy7vzTiYuNE/9S5VXP9Mbf7iFRgDbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC/5I6hObpUWa6t7mNPo599P4fpw+TOITkVlTZ1WrHmfVyLcxt744x9N12zWoAIoAAAAAAAAAAAAAAAAxmsaDja1VaqyL12j0UTEcyY7dvbHuZMBN9BdN73k+NPkdBdN73k+NPkpBdTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTE30F03veT40+R0F03veT40+SkDTGD0/klg6dmW82zk36q7UzMRVMbTvG3s97OAigAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/Z";


// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class App {
	// General Entire Application
	private _scene!: Scene;
	_canvas: HTMLCanvasElement;
	private _engine!: Engine;

	//Scene - related
	private _state = 0;
	private _gamescene: Scene | null = null;
	private _environment: Environment | null = null;
    // private _cutScene: Scene;

	// game attributes
	private game_ws: WebSocket | null = null;
	private gameId: string | undefined;
	private order = 0;
	private opponent = '';
	private gameMode: 'pvp' | 'pvc' | 'tournament' | null = null;
	private avatarSrcs = [defaultAvatar, defaultAvatar];
	private gameObjects: Mesh[] = [];
	private usersAvatars: Rectangle[] = [];
	private scores: TextBlock[] = [];

    constructor() {
		this._canvas = this._createCanvas();
		console.log("gameMode: ", this.gameMode);
		this._init();
    }

	init_game_ws = () => {
			if (this.game_ws)
				return ;
			this.game_ws = new WebSocket('/api/session-management/ws/game', getToken());
			this.game_ws.onopen = () => console.log('Game WebSocket is connected!')
			// 4
			this.game_ws.onmessage = (msg) => {
			const message = msg.data
			// console.log('I got a message!', message);
			const data = JSON.parse(message);
			if ('order' in data)
			{
				this.gameId = data.gameId;
				this.order = data.order;
				this.opponent = data.opponent;

				if (data.avatars[0])
					this.avatarSrcs[0] = data.avatars[0];
				if (data.avatars[1])
					this.avatarSrcs[1] = data.avatars[1];

				this._goToGame();
				console.log("FRONT APP order: ", this.order, " opponent: ", this.opponent);//, this.avatarSrcs);
			}
			else if ('gameResult' in data)
			{
// <<<<<<< HEAD
// 				const isPvcMode = this.opponent === 'AI'; // Simona
//     			const resultIndex = isPvcMode ? 1 : this.order; // Simona - In PvC, human is always index 1
// 				const resultText = data.gameResult[resultIndex]; // Simona - updated to use resultIndex
// 				this.scores[2].text = resultText === 'win' ? 'You lose!' : 'You win!'; // Simona updated messages for AI
// 				if (isPvcMode) { // Simona
// 					this.scores[2].text = resultText === 'win' ? 'AI wins!' : 'You win!'; // Reversed for PvC
// 				} else {
// 					this.scores[2].text = resultText === 'win' ? 'You win!' : 'You lose!'; // Normal for PvP
// 				}
// 				console.log("FRONT APP gameResult: ", data.gameResult[resultIndex]); // Simona // Update log to use resultIndex
// =======
				switch (data.gameResult[this.order])
				{
					case MatchOptions.WIN:
						this.scores[2].text = 'YOU WIN';
						break;
					case MatchOptions.LOSE:
						this.scores[2].text = 'YOU LOSE';
						break;
					case MatchOptions.TECHNICAL_WIN:
						this.scores[2].text = 'TECHNICAL WIN';
						break;
					case MatchOptions.FORFEIT:
						this.scores[2].text = 'TECHNICAL LOSE';
						break;
					default:
						this.scores[2].text = 'DRAW';
				}
				// this.scores[2].text = `You ${data.gameResult[this.order]}`;
				console.log("FRONT APP gameResult: ", data.gameResult[this.order]);
				//TODO::
				this.setGameMode(null);
// >>>>>>> origin/dev
			}
			else if ('score' in data)
			{
				if (this.scores.length >= 2)
				{
					const isPvcMode = this.opponent === 'AI'; // Simona
					if (isPvcMode)
					{
						// Store old scores to detect changes
						const oldHumanScore = parseInt(this.scores[0].text) || 0;
						const oldAiScore = parseInt(this.scores[1].text) || 0;
						// Update scores: human on left (data.score[1]), AI on right (data.score[0])
						this.scores[0].text = data.score[1].toString(); // Human score
						this.scores[1].text = data.score[0].toString(); // AI score
						console.log("FRONT APP score (PvC mode): ", data.score);
						// Trigger animation based on who scored by comparing old and new scores
						const newHumanScore = data.score[1];
						const newAiScore = data.score[0];
						if (newHumanScore > oldHumanScore)
						{
							// Human scored, animate human avatar (left, index 0)
							this._scene.beginAnimation(this.usersAvatars[0], 0, 100, false);
							console.log("Human scored, animating human avatar");
						}
						else if (newAiScore > oldAiScore)
						{
							// AI scored, animate AI avatar (right, index 1)
							this._scene.beginAnimation(this.usersAvatars[1], 0, 100, false);
							console.log("AI scored, animating AI avatar");
						}
					}
					else // PvP mode (keeping the original order)
					{
						if (this.scores[0].text != data.score[0])
						{
							this.scores[0].text = data.score[0].toString();
							console.log("FRONT APP score (PvC mode): ", data.score);
							this._scene.beginAnimation(this.usersAvatars[0], 0, 100, false);
						}
						else
						{
							this.scores[1].text = data.score[1].toString();
							console.log("FRONT APP score: ", data.score);
							this._scene.beginAnimation(this.usersAvatars[1], 0, 100, false);
						}
					}
				}
			}
			else if ('pos' in data) // modified by Simona - added countdown phase
				{
					// Modified by Simona - Don't transition to game during countdown
					if (this._state !== State.GAME && this._state !== State.CUTSCENE)
						this._goToGame();
					if (this.gameObjects.length === 3 && this._state === State.GAME)
					{
						this.gameObjects[0].position.z = data.pos[0][2];
						this.gameObjects[1].position.z = data.pos[1][2];
						this.gameObjects[2].position.x = data.ball[0];
						this.gameObjects[2].position.z = data.ball[2];
					}
				}
// <<<<<<< HEAD

			// console.log(this.gameId);
			//   message.innerHTML += `<br /> ${message}`
// =======
			// }
// >>>>>>> origin/dev
			}
			// 5
			this.game_ws.onerror = (error) => console.log('Game WebSocket error', error)
			// 6
			this.game_ws.onclose = () => console.log('Game: Disconnected from the WebSocket server')
		}
	close_game_ws = () => {
		if (!this.game_ws)
			return ;
		this.game_ws.close();
		this.game_ws = null;
	}


	appendTo(parent: HTMLElement)
	{
		parent.appendChild(this._canvas);
		// this._engine.resize();
	}

	setGameMode = (mode: 'pvp' | 'pvc' | 'tournament' | null, opponent_name = "", opponentId = 0, isInitiator = false) => {
		console.log("0.0. GAME APP - setGameMode, mode: ", mode, " opponent_name: ", opponent_name);
		if (mode === null && this._state !== State.START)
		{
			console.log("0.0.1. GAME APP - setGameMode, mode is already set, reloading game");
			this.reloadGame();
			return ;
		}
		this.gameMode = mode;
		if (this.gameMode === 'tournament' && !!opponent_name)
		{
			this.opponent = opponent_name;
			if (isInitiator)
				this.game_ws?.send(JSON.stringify({"matchmaking": true, "mode": "tournament", "opponentId": opponentId}));
			this._goToWaitingRoom();
		}
	}

	addMeshToCollection = (object: Mesh) => {
		this.gameObjects.push(object);
	}

	clearMeshToCollection = () => {
		this.gameObjects = [];
	}

	private async _init(): Promise<void> {
        this._engine = (await EngineFactory.CreateAsync(this._canvas, undefined)) as Engine;
        this._scene = new Scene(this._engine);

        window.addEventListener("keydown", (ev) => {
            //Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        //MAIN render loop & state machine
        await this._main();
    }


    private async _main(): Promise<void> {
        await this._goToStart();

        // Register a render loop to repeatedly render the scene
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
                case State.CUTSCENE:
                    this._scene.render();
                    break;
				case State.WAITING:
					this._scene.render();
						break;
                case State.GAME:
                    this._scene.render();
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default: break;
            }
			this._engine.resize();
        });

    }
	private _createCanvas(){
		 // create the canvas html element and attach it to the webpage
		 this._canvas = document.createElement("canvas");
		 this._canvas.style.width = "100%";
		 this._canvas.id = "gameCanvas";
		 document.body.appendChild(this._canvas);
		 return this._canvas;
	}

	private async _goToStart() {
		console.log("1.0. GAME APP - _goToStart, game mode: ", this.gameMode);
		this._engine.displayLoadingUI();

		await this.init_game_ws();
		if (this.gameMode === 'tournament')
		{
			console.log("1.1.  GAME APP - _goToStart, game mode: tournament");
			await this._goToWaitingRoom();
			return ;
		}
		this._scene.detachControl();
		const scene =new Scene(this._engine);
		scene.clearColor = new Color4(0, 0, 0, 1);
		const camera = new FreeCamera("camera1", new Vector3(0, 0, 0));
		camera.setTarget(Vector3.Zero());

		await scene.whenReadyAsync();
		this._engine.hideLoadingUI();
		this._scene.dispose();
		this._scene = scene;
		this._state = State.START;

		const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI');
		guiMenu.idealHeight = 720;

		const startSinglePlayerButton= Button.CreateSimpleButton("startpvc", "SINGLE PLAYER MODE");
		startSinglePlayerButton.width = 0.2;
		startSinglePlayerButton.height = "40px";
		startSinglePlayerButton.color = "white";
		startSinglePlayerButton.top = "-24px";
		startSinglePlayerButton.thickness = 0;
		startSinglePlayerButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		guiMenu.addControl(startSinglePlayerButton);

		const multiSinglePlayerButton= Button.CreateSimpleButton("startpvp", "MULTI PLAYER MODE");
		multiSinglePlayerButton.width = 0.2;
		multiSinglePlayerButton.height = "40px";
		multiSinglePlayerButton.color = "white";
		multiSinglePlayerButton.top = "24px";
		multiSinglePlayerButton.thickness = 0;
		multiSinglePlayerButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		guiMenu.addControl(multiSinglePlayerButton);

		startSinglePlayerButton.onPointerDownObservable.add(async() => {
			this.setGameMode('pvc');
			// this._goToGame();
			await this._goToWaitingRoom();
			this.game_ws?.send(JSON.stringify({"matchmaking": true, "mode": "pvc"}));
// <<<<<<< HEAD
			//this._goToGame();
// =======

// >>>>>>> origin/dev
			scene.detachControl(); //observables disabled
		})
		multiSinglePlayerButton.onPointerDownObservable.add(async() => {
			// TODO: search for the opponent
			this.setGameMode('pvp');
			await this._goToWaitingRoom();
			this.game_ws?.send(JSON.stringify({"matchmaking": true, "mode": "pvp"}));
			scene.detachControl();
		})

	}
	private async _goToLose(): Promise<void> {
		this._engine.displayLoadingUI();
		this.gameId = undefined;
		this.close_game_ws();

		//--SCENE SETUP--
		this._scene.detachControl();
		const scene = new Scene(this._engine);
		scene.clearColor = new Color4(0, 0, 0, 1);
		const camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
		camera.setTarget(Vector3.Zero());

		//--GUI--
		const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
		const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
		mainBtn.width = 0.2;
		mainBtn.height = "40px";
		mainBtn.color = "white";
		guiMenu.addControl(mainBtn);
		//this handles interactions with the start button attached to the scene
		mainBtn.onPointerUpObservable.add(() => {
			this._goToStart();
		});

		//--SCENE FINISHED LOADING--
		await scene.whenReadyAsync();
		this._engine.hideLoadingUI(); //when the scene is ready, hide loading
		//lastly set the current state to the lose state and set the scene to the lose scene
		this._scene.dispose();
		this._scene = scene;
		this._state = State.LOSE;
	}
	private async _goToWaitingRoom(): Promise<void> {
		this._engine.displayLoadingUI();

		// for tournament mode, jin response from user
		//--SCENE SETUP--
		this._scene.detachControl();
		const scene = new Scene(this._engine);
		scene.clearColor = new Color4(0, 0, 0, 1);

		const fontData = await (await fetch("https://assets.babylonjs.com/fonts/Droid Sans_Regular.json")).json();

		const notification = `Waiting for ${this.gameMode == 'pvc' ? "AI session" :  this.gameMode == 'pvp' ? "match" : this.opponent}`;
		MeshBuilder.CreateText('notification', notification, fontData, {
            size: 0.5,
			depth: 0.05,
			resolution: 32
        }, scene, earcut);

		const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 0.5 }, scene);
		const sphere2 = MeshBuilder.CreateSphere("sphere", { diameter: 0.5 }, scene);
		const sphere3 = MeshBuilder.CreateSphere("sphere", { diameter: 0.5 }, scene);
		sphere.position._y = -1;
		sphere2.position._y = -1;
		sphere3.position._y = -1;
		sphere.position._x = -1;
		sphere2.position._x = 0;
		sphere3.position._x = 1;
		let direction = true;
		let direction2 = true;
		let direction3 = true;

		scene.onBeforeRenderObservable.add(() => {
			if (sphere3.position.y < -1 && direction3) {
				sphere3.position.y += 0.01;
			}
			else {
				direction3 = false;
			}

			if (sphere3.position.y > -2 && !direction3) {
				sphere3.position.y -= 0.01;
			}
			else {
				direction3 = true;
			}
			setTimeout(()=>{
				if (sphere2.position.y < -1 && direction2) {
					sphere2.position.y += 0.01;
				}
				else {
					direction2 = false;
				}

				if (sphere2.position.y > -2 && !direction2) {
					sphere2.position.y -= 0.01;
				}
				else {
					direction2 = true;
				}
			}, 200)
			setTimeout(()=>{
				if (sphere.position.y < -1 && direction) {
					sphere.position.y += 0.01;
				}
				else {
					direction = false;
				}

				if (sphere.position.y > -2 && !direction) {
					sphere.position.y -= 0.01;
				}
				else {
					direction = true;
				}
			}, 400)
		});
		scene.createDefaultCameraOrLight(true, false, true);
		//--GUI--
		const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");

		const mainBtn = Button.CreateSimpleButton("leave", "LEAVE");
		mainBtn.width = 0.2;
		mainBtn.height = "40px";
		mainBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		mainBtn.top = "-14px";
		mainBtn.color = "white";
		guiMenu.addControl(mainBtn);
		//this handles interactions with the start button attached to the scene
		mainBtn.onPointerUpObservable.add(() => {
			if (this.gameMode === 'pvp')
				this.game_ws?.send(JSON.stringify({"matchmaking": false}));
			this.gameMode = null;
			this.gameId = undefined;
			this.order = 0;
			this.opponent = '';
			this.close_game_ws();
			this._goToStart();
		});

		//--SCENE FINISHED LOADING--
		await scene.whenReadyAsync();
		this._engine.hideLoadingUI(); //when the scene is ready, hide loading
		//lastly set the current state to the lose state and set the scene to the lose scene
		this._scene.dispose();
		this._scene = scene;
		this._state = State.WAITING;
	}



	private _setGameGUI(playerUI: AdvancedDynamicTexture) {
		this.usersAvatars = [];
		this.scores	= [];

		// Added by Simona
   		// Detect PVC mode and use correct labels
		const isPvcMode = this.opponent === 'AI';

		//const leftPlayer = new TextBlock(`player-${this.order? this.opponent: 'you'}`, `${isPvcMode ? 'AI' : this.order? this.opponent: 'you'}`);

		// Simona added this
		const leftPlayer = new TextBlock(
			`player-left`,
			isPvcMode ? 'AI' : (this.order === 0 ? 'you' : this.opponent)
		);


		leftPlayer.color = "white";
		leftPlayer.fontSize = "text-xl";
		leftPlayer.height = "50px";
		leftPlayer.heightInPixels = leftPlayer.fontSizeInPixels;

		leftPlayer.top = "14px";
		leftPlayer.left = "14px";
		leftPlayer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		leftPlayer.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		leftPlayer.textWrapping = 3;
		leftPlayer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		playerUI.addControl(leftPlayer);

		const leftPlayerAvatarContainer = new Rectangle();
		leftPlayerAvatarContainer.cornerRadius = 30;
		leftPlayerAvatarContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		leftPlayerAvatarContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		leftPlayerAvatarContainer.top = "20px";
		leftPlayerAvatarContainer.left = "30%";
		leftPlayerAvatarContainer.width = "50px";
		leftPlayerAvatarContainer.height = "50px";
		leftPlayerAvatarContainer.thickness = 0;
		//const leftPlayerAvatar = new Image(`avatar-${this.order? this.opponent: 'you'}`, this.avatarSrcs[0]);
		// Simona added this
		const leftPlayerAvatar = new Image(
			`avatar-left`, // Fixed name
			isPvcMode ? this.avatarSrcs[1] : this.avatarSrcs[0]  // ✅ AI avatar on left in PVC
		);
		leftPlayerAvatarContainer.addControl(leftPlayerAvatar);
		playerUI.addControl(leftPlayerAvatarContainer);
		this.usersAvatars.push(leftPlayerAvatarContainer);

		const leftPlayerScore = new TextBlock(`left-score`, `${0}`);
		leftPlayerScore.color = "white";
		leftPlayerScore.fontSize = 36;
		leftPlayerScore.widthInPixels = 50;
		leftPlayerScore.height = "50px";
		leftPlayerScore.top = "14px";
		leftPlayerScore.left = "40%";
		leftPlayerScore.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		leftPlayerScore.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		leftPlayerScore.textWrapping = 3;
		leftPlayerScore.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		playerUI.addControl(leftPlayerScore);
		this.scores.push(leftPlayerScore);

		//const rightPlayer = new TextBlock(`player-${this.order?'you': this.opponent}`, `${this.order?'you': this.opponent}`);

		// Simona added this // NEW CHANGE
		const rightPlayer = new TextBlock(
			`player-right`,
			isPvcMode ? 'You' : (this.order === 1 ? 'you' : this.opponent)
		);

		rightPlayer.color = "white";
		rightPlayer.fontSize = "text-xl";
		rightPlayer.widthInPixels = 50;
		rightPlayer.height = "50px";
		rightPlayer.textWrapping = 3;
		rightPlayer.top = "14px";
		rightPlayer.left = "-14px";
		rightPlayer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		rightPlayer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		playerUI.addControl(rightPlayer);

		const rightPlayerAvatarContainer = new Rectangle();
		rightPlayerAvatarContainer.cornerRadius = 30;
		rightPlayerAvatarContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		rightPlayerAvatarContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		rightPlayerAvatarContainer.top = "20px";
		rightPlayerAvatarContainer.left = "-30%";
		rightPlayerAvatarContainer.width = "50px";
		rightPlayerAvatarContainer.height = "50px";
		rightPlayerAvatarContainer.thickness = 0;
		//const rightPlayerAvatar = new Image(`avatar-${this.order? this.opponent: 'you'}`, this.avatarSrcs[1]);

		// Simona added this
		const rightPlayerAvatar = new Image(
			`avatar-right`, // name
			isPvcMode ? this.avatarSrcs[0] : this.avatarSrcs[1]  // ✅ Human avatar on right in PVC
		);
		rightPlayerAvatarContainer.addControl(rightPlayerAvatar);
		playerUI.addControl(rightPlayerAvatarContainer);
		this.usersAvatars.push(rightPlayerAvatarContainer);

		const rightPlayerScore = new TextBlock(`right-score`, `${0}`);
		rightPlayerScore.color = "white";
		rightPlayerScore.fontSize = 36;
		rightPlayerScore.widthInPixels = 50;
		rightPlayerScore.height = "50px";
		rightPlayerScore.top = "14px";
		rightPlayerScore.left = "-40%";
		rightPlayerScore.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		rightPlayerScore.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		rightPlayerScore.textWrapping = 3;
		rightPlayerScore.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		playerUI.addControl(rightPlayerScore);
		this.scores.push(rightPlayerScore);

		const gameResult = new TextBlock(`game_result`, ``);
		gameResult.color = "white";
		gameResult.fontSize = "text-xl";
		gameResult.widthInPixels = 150;
		gameResult.height = "50px";
		gameResult.textWrapping = 3;
		gameResult.top = "70px";
		// rightPlayer.left = "-14px";
		gameResult.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		gameResult.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		playerUI.addControl(gameResult);
		this.scores.push(gameResult);

		const animationScaleY = new Animation("myAnimationY", "scaleY", 20, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONTYPE_VECTOR3);
        const animationScaleX = new Animation("myAnimationX", "scaleX", 20, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONTYPE_VECTOR3);

        const keys = [];

        keys.push({
            frame: 0,
            value: 1
        });

        keys.push({
            frame: 5,
            value: 1.2
        });
        keys.push({
            frame: 10,
            value: 1
        });
        keys.push({
            frame: 15,
            value: 1.2
        });
        keys.push({
            frame: 20,
            value: 1
        });
        animationScaleY.setKeys(keys);
        animationScaleX.setKeys(keys);
		leftPlayerAvatarContainer.animations = [];
		leftPlayerAvatarContainer.animations.push(animationScaleY);
		leftPlayerAvatarContainer.animations.push(animationScaleX);
		rightPlayerAvatarContainer.animations = [];
		rightPlayerAvatarContainer.animations.push(animationScaleY);
		rightPlayerAvatarContainer.animations.push(animationScaleX);
	}
	// modified by Simona - added countdown phase
	private async _goToGame() {
		//--SETUP SCENE--
		//console.log("GO_TO_GAME");
		console.log("GO_TO_GAME - Starting countdown phase");
		// Set up the game scene but don't set GAME state immediately
		this._engine.displayLoadingUI();
		this._scene.detachControl();
		this._setUpGame();
		const scene = this._gamescene as Scene;
		scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098); // a color that fit the overall color scheme better
        const camera = new FreeCamera("camera1", new Vector3(0, 90, 120), scene);

		camera.setTarget(Vector3.Zero());

		//--GUI--
		const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
		this._setGameGUI(playerUI);
		scene.detachControl();

		//create a simple button
		const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
		loseBtn.width = 0.2
		loseBtn.height = "40px";
		loseBtn.color = "white";
		loseBtn.top = "-14px";
		loseBtn.thickness = 0;
		loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		playerUI.addControl(loseBtn);

		//this handles interactions with the start button attached to the scene
		loseBtn.onPointerDownObservable.add(() => {
			this._goToLose();
			scene.detachControl(); //observables disabled
		});

		//temporary scene objects
		new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
		MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

		//get rid of start scene, switch to gamescene and change states
		this._scene.dispose();
		this._state = State.GAME;
		this._scene = scene;
		this._engine.hideLoadingUI();

		// Simona - added - Don't attach controls immediately, wait for countdown
		// Modified by Simona - Don't set game as active immediately
		// Change the state temporarily to prevent immediate gameplay
		this._state = State.CUTSCENE; // Use CUTSCENE as countdown state

		// Only attach controls after countdown finishes (5 seconds)
		setTimeout(() => {
			console.log("Countdown finished - game controls now active");
			this._state = State.GAME; // Set state to GAME after countdown
			this._scene.attachControl();
		}, 5000); // Wait 5 seconds for countdown to finish

		//the game is ready, attach control back
		//this._scene.attachControl(); //
	}


	private async _setUpGame() {
		//--CREATE SCENE--
		const scene = new Scene(this._engine);
		this._gamescene = scene;

		//--CREATE ENVIRONMENT--
		const isPvcMode = this.opponent === 'AI';
		if (this.game_ws) {
			const environment = new Environment(scene, this.game_ws, this.gameId || '', this.addMeshToCollection, this.clearMeshToCollection, isPvcMode);
			this._environment = environment; //class variable for App
			await this._environment.load(); //environment
		} else {
			console.error("WebSocket is not initialized.");
		}

	}

	reloadGame = () => {
		console.log("RELOAD GAME");
		this._state = State.START;
		this.gameMode = null;
		this.gameId = undefined;
		this.order = 0;
		this.opponent = '';
		this.avatarSrcs = [defaultAvatar, defaultAvatar];
		setTimeout(() =>this._goToStart(), 1000);
	}

	updateSocket = (isAuth: boolean) => {
		if (!isAuth) {
			this.close_game_ws();
			// this._goToStart();
		} else {
			this.init_game_ws();
		}

	}

}

