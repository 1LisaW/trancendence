import { Animation, Color3, KeyboardEventTypes, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { setCountdown } from "./Contdown";

export default class Environment {
    private _scene: Scene;
	sceneParams = {
        ground: {
            name : "ground",
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
    constructor(scene: Scene) {
        this._scene = scene;

    }

    public async load() {
		await setCountdown(this._scene);
        const sceneParams = this.sceneParams;

		const box1 = MeshBuilder.CreateBox(sceneParams.player.name, sceneParams.bat, this._scene);
        box1.position.x = sceneParams.player.startPosition[0];
        box1.position.y = sceneParams.player.startPosition[1];
        const sphere = MeshBuilder.CreateSphere("Sphere1", {diameter: 4}, this._scene);
        sphere.position.y = sceneParams.ball.diameter / 2;

        const box2 = MeshBuilder.CreateBox(sceneParams.opponent.name, sceneParams.bat, this._scene);
        box2.position.x = sceneParams.opponent.startPosition[0];
        box2.position.y =  sceneParams.opponent.startPosition[1];
        const materialBox = new StandardMaterial("texture1", this._scene);
        materialBox.diffuseColor = new Color3(0.27, 0.16, 0.88);//Green
        const materialBox2 = new StandardMaterial("texture2", this._scene);
        materialBox2.diffuseColor = new Color3(0.88, 0.25, 0.25);//Green

        box1.material = materialBox;
        box1.setDirection(new Vector3(...sceneParams.player.vector));
        box2.setDirection(new Vector3(...sceneParams.opponent.vector));
        box2.material = materialBox2;

		const xSlide = new Animation("zSlide", "position.z", 10, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        const keyFrames = [];
        const maxB = 25;
        keyFrames.push({
        frame: 0,
        value: maxB,
        });

        keyFrames.push({
        frame: 5,
        value: -maxB,
        });
        keyFrames.push({
        frame: 10,
        value: maxB,
        });

        xSlide.setKeys(keyFrames);
        box2.animations.push(xSlide);
        this._scene.beginAnimation(box2, 10, 0, true);

        const MoveBat = (bat: Mesh, key: string) => {
            const boundry = (sceneParams.ground.height - sceneParams.bat.width) / 2;
            if (key == 'ArrowUp')
            {
                if (box1.position.z - 10  >= -1 * boundry)
                    box1.position.z -= 10;
                else
                    box1.position.z = -1 * boundry;
            }
            else if (key == 'ArrowDown')
                if (box1.position.z + 10 <= boundry)
                    box1.position.z += 10;
                 else
                    box1.position.z = boundry;

        }
        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                console.log("KEY DOWN: ", kbInfo.event.key);
                MoveBat(box1, kbInfo.event.key);
                break;
                case KeyboardEventTypes.KEYUP:
                console.log("KEY UP: ", kbInfo.event.code);
                break;
            }
        });
        sphere.position.y++;
        const ground = MeshBuilder.CreateGround("ground", {width: sceneParams.ground.width, height: sceneParams.ground.height}, this._scene);
        ground.scaling = new Vector3(1,.02,1);
    }
};
