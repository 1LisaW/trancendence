import { Animation, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

export const setCountdown = async (scene: Scene) => {
    const fontData = await (await fetch("https://assets.babylonjs.com/fonts/Droid Sans_Regular.json")).json();

    const disapearNumber = new Animation("disapearNumber", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const slideZNumber = new Animation("disapearNumber", "position.z", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

    const disapearKeys = [];
    const slideZKeys = [];
    // let delay = 0;
    for (let i = 0; i < 4; i++)
    {
        disapearKeys.push({
        frame: 60 * i,
        value: 0,
        });
        slideZKeys.push({
            frame: i * 60,
            value: 0
        })
    }
    disapearKeys.push(
    {
        frame: 240,
        value: 1,
    });
    disapearKeys.push(
    {
        frame: 300,
        value: 0,
    });
    slideZKeys.push({
        frame: 240,
        value: 0,
    });
      slideZKeys.push({
        frame: 300,
        value: -100,
    });
    disapearNumber.setKeys(disapearKeys);
    slideZNumber.setKeys(slideZKeys);

    let delay = 240;
    for (let i=5; i>0; i--)
    {
        const myText = MeshBuilder.CreateText(`myText${i}`, `${i}`, fontData, {
            size: 2,
            resolution: 90,
            depth: 10,

        });
        const mat = new StandardMaterial(`mat${i}`);

		if (!myText)
			break ;
		myText.scaling = new Vector3(-20, 15, 1);
        myText.material = mat;
        myText.position.z = 100;
        myText.animations.push(slideZNumber);
        myText.animations.push(disapearNumber);
        scene.beginAnimation(myText,delay, 300, false);
        delay -= 60;
    }
};
