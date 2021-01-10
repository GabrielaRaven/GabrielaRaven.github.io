import * as ECS from '../libs/pixi-ecs';

const SCENE_WIDTH = 20;
const SCENE_HEIGHT = 16;
const TEXTURE_SCALE = SCENE_WIDTH / (20 * 24);

enum Tags {
    BRICK = 'brick',
    PATH = 'path',
    FLOWER = 'flower',
    PLAYER = 'player'
}

class CollisionHandler extends ECS.Component {
    onUpdate(delta: number, absolute: number) {
        const player = this.scene.findObjectByTag(Tags.PLAYER);
        const bricks = this.scene.findObjectsByTag(Tags.BRICK);

        let colliders = []
        
        const playerBox = player.getBounds();

        for (let collider of colliders) {
            const cBox = collider.getBounds();
            const left_collision = this.leftCollision(playerBox, cBox);
            const right_collision = this.rightCollision(playerBox, cBox);
            const upper_collision = this.upperCollision(playerBox, cBox);
            const bottom_collision = this.bottomCollision(playerBox, cBox);

            const collides = left_collision || right_collision || upper_collision || bottom_collision;

            if (left_collision) {
            
                player.assignAttribute('can_move_left', false);
            }
            if (right_collision) {
                player.assignAttribute('can_move_right', false);
            }
            if (upper_collision) {
                player.assignAttribute('can_move_up', false);
            }
            if (bottom_collision) {
                player.assignAttribute('can_move_down', false);
            }

        }
    }

    private leftCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle) {
        return myBounds.left < otherBounds.right && Math.min(myBounds.bottom, otherBounds.bottom) - Math.max(myBounds.top, otherBounds.top) > 0;
    }

    private rightCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle) {
        return myBounds.right > otherBounds.left && Math.min(myBounds.bottom, otherBounds.bottom) - Math.max(myBounds.top, otherBounds.top) > 0;
    }

    private upperCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle) {
        return Math.min(myBounds.right, otherBounds.right) - Math.max(myBounds.left, otherBounds.left) > 0 && otherBounds.bottom > myBounds.top ;
    }

    private bottomCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle) {
        return Math.min(myBounds.right, otherBounds.right) - Math.max(myBounds.left, otherBounds.left) > 0 && otherBounds.top < myBounds.bottom ;
    }

}


class PlayerController extends ECS.Component {
    player: ECS.Container;
    onInit() {
        this.player = this.scene.findObjectByTag(Tags.PLAYER);
    }

    public can_move_left: boolean;
    public can_move_right: boolean;
    public can_move_up: boolean;
    public can_move_down: boolean;

    get can_move_left() {
        return this.can_move_left;
    }

    moveLeft(units: number) {
        const bbox = this.owner.getBounds();
        if (bbox.left > 0) {
			this.owner.position.x -= Math.min(units, bbox.left);
		}
    }
    
    moveRight(units: number) {
        const bbox = this.owner.getBounds();
		if (bbox.right <= SCENE_WIDTH) {
			this.owner.position.x += Math.min(units, SCENE_WIDTH - bbox.right );
		}
    }
    moveUp(units: number) {
        const bbox = this.owner.getBounds();
		if (bbox.top > 0) {
			this.owner.position.y -= Math.min(units, bbox.top);
		}
    }
    moveDown(units: number) {
        const bbox = this.owner.getBounds();
		if (bbox.bottom <= SCENE_HEIGHT) {
			this.owner.position.y += Math.min(units, SCENE_HEIGHT - bbox.bottom - 1);
		}
    }

    onUpdate(delta: number, absolute: number) {
        const keyInputCmp = this.scene.findGlobalComponentByName<ECS.KeyInputComponent>(ECS.KeyInputComponent.name);

		if (keyInputCmp.isKeyPressed(ECS.Keys.KEY_LEFT)) {
			this.moveLeft(delta * 0.01);
		}
		if (keyInputCmp.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
			this.moveRight(delta * 0.01);
        }
        
        if (keyInputCmp.isKeyPressed(ECS.Keys.KEY_DOWN)) {
			this.moveDown(delta * 0.01);
		}
		if (keyInputCmp.isKeyPressed(ECS.Keys.KEY_UP)) {
			this.moveUp(delta * 0.01);
		}
    }
}


class Bomberman {
    engine: ECS.Engine;

    constructor() {
        this.engine = new ECS.Engine();
        let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

        this.engine.init(canvas, {
            width: canvas.width,
            height: canvas.height,
            resolution: canvas.width / SCENE_WIDTH});
        
        this.engine.app.loader
            .reset()
            .add('spritesheet', './assets/game_bomberman/spritesheet.png')
            .load(() => this.load());
    }


    load() {
        const scene = this.engine.scene;
        let bricks = new ECS.Container('bricksLayer');
        scene.stage.addChild(bricks);
        let boundary = new ECS.Container('boundaryLayer');
        scene.addGlobalComponent(new ECS.KeyInputComponent());
        scene.stage.addChild(boundary);

        for (let i = 1; i < SCENE_WIDTH - 1; i++) {
            for (let j = 1; j < SCENE_HEIGHT - 1; j++) {
                let sprite = new ECS.Sprite('', this.createTexture(0, 0, 24, 24) );
                sprite.addTag(Tags.PATH);
                sprite.scale.set(TEXTURE_SCALE);
                sprite.position.x = i;
                sprite.position.y = j;
                bricks.addChild(sprite);
            }
        }

        // render upper and lower boundaries
        for (let i = 0; i < SCENE_WIDTH; i++) {
                let sprite1 = new ECS.Sprite('', this.createTexture(48, 0, 24, 24) );
                sprite1.addTag(Tags.BRICK);
                sprite1.scale.set(TEXTURE_SCALE);
                sprite1.position.x = i;
                sprite1.position.y = 0;
                boundary.addChild(sprite1);
            
                let sprite2 = new ECS.Sprite('', this.createTexture(48, 0, 24, 24) );
                sprite2.addTag(Tags.BRICK);
                sprite2.scale.set(TEXTURE_SCALE);
                sprite2.position.x = i;
                sprite2.position.y = SCENE_HEIGHT - 2 ;
                boundary.addChild(sprite2);
        } 

        for (let i = 0; i < SCENE_HEIGHT; i++) {
            let sprite3 = new ECS.Sprite('', this.createTexture(48, 0, 24, 24) );
            sprite3.addTag(Tags.BRICK);
            sprite3.scale.set(TEXTURE_SCALE);
            sprite3.position.x = 0;
            sprite3.position.y = i;
            boundary.addChild(sprite3);
        
            let sprite4 = new ECS.Sprite('', this.createTexture(48, 0, 24, 24) );
            sprite4.addTag(Tags.BRICK);
            sprite4.scale.set(TEXTURE_SCALE);
            sprite4.position.x = SCENE_WIDTH - 1;
            sprite4.position.y = i;
            boundary.addChild(sprite4);
        } 

        new ECS.Builder(this.engine.scene)
            .anchor(0)
            .localPos(1, 1)
            .withTag(Tags.PLAYER)
            .asSprite(this.createTexture(72, 0, 24, 24))
            .withParent(scene.stage)
            .withComponent(new PlayerController())
            .scale(TEXTURE_SCALE)
            .build();
    }

    private createTexture(offsetX: number, offsetY: number, width: number, height: number) {
        let texture = PIXI.Texture.from('spritesheet');
        texture = texture.clone();
        texture.frame = new PIXI.Rectangle(offsetX, offsetY, width, height);
        return texture;
    }
}

export default new Bomberman();