import { Color3, KeyboardEventTypes, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { setCountdown } from "./Contdown";

export default class Environment {
    private _scene: Scene;
    private isPvcMode: boolean; // Simona added this
    sceneParams = {
        ground: {
            name: "ground",
            width: 100,
            height: 70
        },
        bat: {
            width: 15,
            height: 10,
            depth: 4
        },
        ball: {
            name: "Sphere1",
            diameter: 2
        },
        player: {
            name: "Box1",
            vector: [1, 0, 0],
            startPosition: [-45, 5, 0],

        },
        opponent: {
            name: "Box2",
            vector: [1, 0, 0],
            startPosition: [45, 5, 0],
        }
    };
    ws_game;
    gameId;
    addMeshToCollection;
    clearMeshToCollection;
    constructor(
        scene: Scene, ws_game: WebSocket,
        gameId: string,
        addMeshToCollection: (object: Mesh) => void,
        clearMeshToCollection: () => void,
        isPvcMode: boolean = false // Simona added this
    ) {
        this._scene = scene;
        this.ws_game = ws_game;
        this.gameId = gameId;
        this.addMeshToCollection = addMeshToCollection;
        this.clearMeshToCollection = clearMeshToCollection;
        this.isPvcMode = isPvcMode; // Simona added this
        this.clearMeshToCollection();
        console.log("***** CreaTe ENVIRONMENT ********");
    }

    public async load() {
        console.log("***** ENVIRONMENT LOAD ********");

        await setCountdown(this._scene);
        const sceneParams = this.sceneParams;

        const box1 = MeshBuilder.CreateBox(sceneParams.player.name, sceneParams.bat, this._scene);
        box1.position.x = sceneParams.player.startPosition[0];
        box1.position.y = sceneParams.player.startPosition[1];
        const sphere = MeshBuilder.CreateSphere("Sphere1", { diameter: 4 }, this._scene);
        sphere.position.y = sceneParams.ball.diameter / 2;

        const box2 = MeshBuilder.CreateBox(sceneParams.opponent.name, sceneParams.bat, this._scene);
        box2.position.x = sceneParams.opponent.startPosition[0];
        box2.position.y = sceneParams.opponent.startPosition[1];
        const materialBox = new StandardMaterial("texture1", this._scene);
        materialBox.diffuseColor = new Color3(0.27, 0.16, 0.88);//Green
        const materialBox2 = new StandardMaterial("texture2", this._scene);
        materialBox2.diffuseColor = new Color3(0.88, 0.25, 0.25);//Green

        box1.material = materialBox;
        box1.setDirection(new Vector3(...sceneParams.player.vector));
        box2.setDirection(new Vector3(...sceneParams.opponent.vector));
        box2.material = materialBox2;

        // const xSlide = new Animation("zSlide", "position.z", 10, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        // const keyFrames = [];
        // const maxB = 25;
        // keyFrames.push({
        //     frame: 0,
        //     value: maxB,
        // });

        // keyFrames.push({
        //     frame: 5,
        //     value: -maxB,
        // });
        // keyFrames.push({
        //     frame: 10,
        //     value: maxB,
        // });

        // xSlide.setKeys(keyFrames);
        // box2.animations.push(xSlide);
        // this._scene.beginAnimation(box2, 10, 0, true);

        const MoveBat = (bat: Mesh, key: string) => {
            console.log(bat.position.x);
            
            //  FIX: Send the same step values regardless of which paddle
            // The game service will interpret them correctly based on player ID
            if (key == 'ArrowUp') {
                this.ws_game.send(JSON.stringify({ gameId: this.gameId, step: -1 }));
            }
            else if (key == 'ArrowDown') {
                this.ws_game.send(JSON.stringify({ gameId: this.gameId, step: 1 }));
            }
        }

        // Modified by Simona - Don't attach keyboard controls immediately, wait for countdown
        setTimeout(() => {
            console.log("Countdown finished - keyboard controls now active");
            this._scene.onKeyboardObservable.add((kbInfo) => {
                // 🔧 Simona's change to Use correct paddle based on PVC mode
                const humanControlledPaddle = this.isPvcMode ? box2 : box1;
                switch (kbInfo.type) {
                    case KeyboardEventTypes.KEYDOWN:
                        console.log("KEY DOWN: ", kbInfo.event.key);
                        //MoveBat(box1, kbInfo.event.key);
                        MoveBat(humanControlledPaddle, kbInfo.event.key); // Simona's change to Use correct paddle based on PVC mode
                        break;
                    case KeyboardEventTypes.KEYUP:
                        console.log("KEY UP: ", kbInfo.event.code);
                        break;
                }
            });
        }, 5000); // Wait 5 seconds for countdown to finish

        sphere.position.y++;
        this.addMeshToCollection(box1);
        this.addMeshToCollection(box2);
        this.addMeshToCollection(sphere);
        const ground = MeshBuilder.CreateGround("ground", { width: sceneParams.ground.width, height: sceneParams.ground.height }, this._scene);
        ground.scaling = new Vector3(1, .02, 1);
    }
};
