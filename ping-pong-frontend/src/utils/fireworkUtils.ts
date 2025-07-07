import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, ParticleSystem, Texture, Color4 } from "@babylonjs/core";

export function createSceneWithFireworks(color: "green" | "red") {
	const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);

	const camera = new ArcRotateCamera("camera", 0, 1.5, 10, Vector3.Zero(), scene);
	camera.attachControl(canvas, true);
	new HemisphericLight("light", new Vector3(0, 1, 0), scene);

	const particleSystem = new ParticleSystem("fireworks", 2000, scene);
	particleSystem.particleTexture = new Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);

	particleSystem.emitter = new Vector3(0, 0, 0);
	particleSystem.minEmitBox = new Vector3(-5, 0, -5);
	particleSystem.maxEmitBox = new Vector3(5, 0, 5);

	const colorVec = color === "green" ? new Color4(0, 1, 0, 1) : new Color4(1, 0, 0, 1);
	particleSystem.color1 = colorVec;
	particleSystem.color2 = colorVec;

	particleSystem.minSize = 0.2;
	particleSystem.maxSize = 1;
	particleSystem.minLifeTime = 0.3;
	particleSystem.maxLifeTime = 1.5;
	particleSystem.emitRate = 1000;
	particleSystem.gravity = new Vector3(0, -9.81, 0);
	particleSystem.direction1 = new Vector3(-1, 8, 1);
	particleSystem.direction2 = new Vector3(1, 8, -1);

	particleSystem.start();
	engine.runRenderLoop(() => scene.render());
}
