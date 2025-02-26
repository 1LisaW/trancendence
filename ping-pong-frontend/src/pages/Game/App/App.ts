/* eslint-disable @typescript-eslint/no-unused-vars */
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, Color4, FreeCamera, EngineFactory, StandardMaterial } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui";
import { Control } from "@babylonjs/gui/2D/controls/control";
import Environment from "./Environment";
import { getToken } from "../../../utils/auth";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3, WAITING = 4 }



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

	private game_ws: WebSocket | null = null;
	private gameId: string | undefined;

    constructor() {
		this._canvas = this._createCanvas();
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
			console.log('I got a message!', message);
			console.log(this.gameId);
			//   message.innerHTML += `<br /> ${message}`
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
                    //if 240seconds/ 4mins have have passed, go to the lose state
                    // if (this._ui.time >= 240 && !this._player.win) {
                    //     this._goToLose();
                    //     this._ui.stopTimer();
                    // }
                    // if (this._ui.quit) {
                    //     this._goToStart();
                    //     this._ui.quit = false;
                    // }
                    this._scene.render();
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default: break;
            }
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
		this._engine.displayLoadingUI();

		await this.init_game_ws();
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

		startSinglePlayerButton.onPointerDownObservable.add(() => {
			this.game_ws?.send(JSON.stringify({"mode": "pvc"}));
			this._goToGame();
			scene.detachControl(); //observables disabled
		})
		multiSinglePlayerButton.onPointerDownObservable.add(() => {
			// TODO: search for the opponent
			this.game_ws?.send(JSON.stringify({"mode": "pvp"}));
			this._goToWaitRoom();
			scene.detachControl();
		})

	}
	private async _goToLose(): Promise<void> {
		this._engine.displayLoadingUI();
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

	private async _goToWaitRoom() {

		this._engine.displayLoadingUI();
		this._scene.detachControl();
		const scene = new Scene(this._engine);
		scene.clearColor = new Color4(0, 0, 0, 1);



		const fontData = await (await fetch("https://assets.babylonjs.com/fonts/Droid Sans_Regular.json")).json();
        const myText = MeshBuilder.CreateText(`pending`, `Waiting for the opponent`, fontData, {
            size: 2,
            resolution: 64,
            depth: 10,

        });
		 const mat = new StandardMaterial(`mat`);
		if (myText)
		myText.material = mat;
		const camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
		camera.setTarget(Vector3.Zero());

		// const textToAnimate = new TextBlock();
		// textToAnimate.text = "Text To Animate";
		// textToAnimate.color = "#FFFFFF";
		// textToAnimate.fontSize = "100px";



		const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
		//dont detect any inputs from this ui while the game is loading
		scene.detachControl();
		//--GUI--
		const loseBtn = Button.CreateSimpleButton("leave", "LEAVE");
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
		await scene.whenReadyAsync();
		this._engine.hideLoadingUI();
		this._scene.dispose();
		this._scene = scene;
		this._state = State.WAITING;
		this._scene.attachControl();
	}

	private async _goToGame() {
		//--SETUP SCENE--
		this._engine.displayLoadingUI();
		this._scene.detachControl();
		this._setUpGame();
		const scene = this._gamescene as Scene;
		scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098); // a color that fit the overall color scheme better
        const camera = new FreeCamera("camera1", new Vector3(0, 90, 120), scene);

		camera.setTarget(Vector3.Zero());

		//--GUI--
		const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
		//dont detect any inputs from this ui while the game is loading
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
		// const light1: HemisphericLight =
		new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
		// const sphere: Mesh =
		MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

		//get rid of start scene, switch to gamescene and change states
		this._scene.dispose();
		this._state = State.GAME;
		this._scene = scene;
		this._engine.hideLoadingUI();
		//the game is ready, attach control back
		this._scene.attachControl();
	}


	private async _setUpGame() {
		//--CREATE SCENE--
		const scene = new Scene(this._engine);
		this._gamescene = scene;

		//--CREATE ENVIRONMENT--
		const environment = new Environment(scene);
		this._environment = environment; //class variable for App
		await this._environment.load(); //environment
	}

}
