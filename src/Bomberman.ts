import * as ECS from '../libs/pixi-ecs';
import { Tags, TEXTURE_SCALE, SCENE_WIDTH, SCENE_HEIGHT, _X, _Y, gs, GameState, 
         FIRST_PLAYER_CONTROLS, SECOND_PLAYER_CONTROLS } from './Common';
import { HumanPlayerController } from './HumanPlayerController';
import { CollisionHandler } from './CollisionHandler';
        

export class Bomberman {
    engine: ECS.Engine;
    start_game_tex: ECS.Sprite;
    game_over_tex: ECS.Sprite;

    constructor() {
        this.engine = new ECS.Engine();
        let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

        this.engine.init(canvas, {
            width: 800,
            height: 600,
			resolution: 800 / SCENE_WIDTH, 
			resizeToScreen: true,
			flagsSearchEnabled: true
		});
        
        this.engine.app.loader
            .reset()
            .add('spritesheet', './assets/spritesheet.png')
            .add('start_game', './assets/start_game.png')
            .add('game_over', './assets/game_over.png')
            .load(() => this.load());
    }

    load() {
        const scene = this.engine.scene;
        scene.addGlobalComponent(new ECS.KeyInputComponent());

        let path = new ECS.Container('pathLayer');
        scene.stage.addChild(path);

        let boundaries = new ECS.Container('boundaryLayer');
        scene.stage.addChild(boundaries);

        let flowers = new ECS.Container('flowersLayer');
        scene.stage.addChild(flowers);

        let bombs = new ECS.Container('bombLayer');
        scene.stage.addChild(bombs);

        this.generateMap(path, flowers, boundaries);
        this.drawBoundaries(boundaries);

        this.createPlayers();

        let xxx = new ECS.Container('xxx');
        scene.stage.addChild(xxx);

        this.start_game_tex = new ECS.Sprite('', Bomberman.createTexture(0, 0, 800, 600, 'start_game'));
        this.start_game_tex.position.x = 0;
        this.start_game_tex.position.y = 0;
        this.start_game_tex.scale.set(TEXTURE_SCALE * 0.6);

        xxx.addChild(this.start_game_tex);
        window.gs = GameState.START;
    }

    createPlayers() {
        new ECS.Builder(this.engine.scene)
        .anchor(0)
        .localPos(1, 1)
        .withTag(Tags.PLAYER1)
        .withTag(Tags.PLAYER)
        .asSprite(Bomberman.createTexture(72, 0, 24, 24))
        .withParent(this.engine.scene.stage)
        .withComponent(new CollisionHandler())
        .withComponent(new HumanPlayerController(FIRST_PLAYER_CONTROLS, Tags.PLAYER1))
        .scale(TEXTURE_SCALE)
        .build();

        new ECS.Builder(this.engine.scene)
        .anchor(0)
        .localPos(SCENE_WIDTH - 2, 1)
        .withTag(Tags.PLAYER2)
        .withTag(Tags.PLAYER)
        .asSprite(Bomberman.createTexture(48, 24, 24, 24))
        .withParent(this.engine.scene.stage)
        .withComponent(new CollisionHandler())
        .withComponent(new HumanPlayerController(SECOND_PLAYER_CONTROLS, Tags.PLAYER2))
        .scale(TEXTURE_SCALE)
        .build();
    }

    private generateMap(path: ECS.Container, flowers: ECS.Container, walls: ECS.Container) {
        for (let i = 1; i < SCENE_WIDTH - 1; i++) {
            for (let j = 1; j < SCENE_HEIGHT - 2; j++) {
                
                let x = Math.random() * 100;
                if ((i == 1 && j == 1) || (i == 18 && j == 1)) {
                    x = 50;
                }
                if (x < 30) {
                    let sprite = new ECS.Sprite('', Bomberman.createTexture(24, 0, 24, 24) );
                    sprite.addTag(Tags.FLOWER);
                    sprite.scale.set(TEXTURE_SCALE);
                    sprite.position.x = i;
                    sprite.position.y = j;
                    flowers.addChild(sprite);
                }
                else if (x < 35) {
                    let sprite = new ECS.Sprite('', Bomberman.createTexture(48, 0, 24, 24) );
                    sprite.addTag(Tags.BOUNDARY);
                    sprite.scale.set(TEXTURE_SCALE);
                    sprite.position.x = i;
                    sprite.position.y = j;
                    walls.addChild(sprite);
                }
                else {
                    let sprite = new ECS.Sprite('', Bomberman.createTexture(0, 0, 24, 24) );
                    sprite.addTag(Tags.PATH);
                    sprite.scale.set(TEXTURE_SCALE);
                    sprite.position.x = i;
                    sprite.position.y = j;
                    path.addChild(sprite);
                }
            }
        }
    }

    private drawBoundaries(boundaries: ECS.Container) {
        // render upper and lower boundaries
        for (let i = 0; i < SCENE_WIDTH; i++) {
            let sprite1 = new ECS.Sprite('', Bomberman.createTexture(48, 0, 24, 24) );
            sprite1.addTag(Tags.BOUNDARY);
            sprite1.scale.set(TEXTURE_SCALE);
            sprite1.position.x = i;
            sprite1.position.y = 0;
            boundaries.addChild(sprite1);
        
            let sprite2 = new ECS.Sprite('', Bomberman.createTexture(48, 0, 24, 24) );
            sprite2.addTag(Tags.BOUNDARY);
            sprite2.scale.set(TEXTURE_SCALE);
            sprite2.position.x = i;
            sprite2.position.y = SCENE_HEIGHT - 2 ;
            boundaries.addChild(sprite2);
        } 

        for (let i = 0; i < SCENE_HEIGHT; i++) {
            let sprite3 = new ECS.Sprite('', Bomberman.createTexture(48, 0, 24, 24) );
            sprite3.addTag(Tags.BOUNDARY);
            sprite3.scale.set(TEXTURE_SCALE);
            sprite3.position.x = 0;
            sprite3.position.y = i;
            boundaries.addChild(sprite3);
        
            let sprite4 = new ECS.Sprite('', Bomberman.createTexture(48, 0, 24, 24) );
            sprite4.addTag(Tags.BOUNDARY);
            sprite4.scale.set(TEXTURE_SCALE);
            sprite4.position.x = SCENE_WIDTH - 1;
            sprite4.position.y = i;
            boundaries.addChild(sprite4);
        } 
    }

    public static createTexture(offsetX: number, offsetY: number, width: number, height: number, name: string = 'spritesheet') {
        let texture = PIXI.Texture.from(name);
        texture = texture.clone();
        texture.frame = new PIXI.Rectangle(offsetX, offsetY, width, height);
        return texture;
    }
}

