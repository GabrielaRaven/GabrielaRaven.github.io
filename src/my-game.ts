import { systems, TextureLoader } from 'pixi.js';
import * as ECS from '../libs/pixi-ecs';

const SCENE_WIDTH = 20;
const SCENE_HEIGHT = 16;
const TEXTURE_SCALE = SCENE_WIDTH / (20 * 24);
const MOVE_CONST = 0.005;
const _X = 0;
const _Y = 1;
const FIRST_PLAYER_CONTROLS:  [ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys] 
                            = [ECS.Keys.KEY_LEFT, ECS.Keys.KEY_RIGHT, ECS.Keys.KEY_UP, ECS.Keys.KEY_DOWN, ECS.Keys.KEY_SPACE];
const SECOND_PLAYER_CONTROLS: [ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys]
                            = [ECS.Keys.KEY_A, ECS.Keys.KEY_D, ECS.Keys.KEY_W, ECS.Keys.KEY_S, ECS.Keys.KEY_SHIFT];

enum Tags {
    BOUNDARY = 'boundary',
    PATH = 'path',
    DANGER = 'danger',
    FLOWER = 'flower',
    PLAYER = 'player',
    AI = 'ai',
    PLAYER1 = 'player1',
    PLAYER2 = 'player2',
    PLAYER3 = 'player3',
    PLAYER4 = 'player4',
    FLAME = 'flame',
    BOMB = 'bomb'
}

enum PlayerFlags {
	LEFT_COLLISION = 1, RIGHT_COLLISION = 2, UPPER_COLLISION = 3, BOTTOM_COLLISION = 4, BOMB_TO_PLANT = 5, KILLED = 6, IN_DANGER = 7
}

enum SpriteStateFlags {
    SPRITE_TO_DESTROY = 12
}

function getSpriteAtPos(x_pos: number, y_pos: number, tag: string, scene: ECS.Scene) {
    let sprites = scene.findObjectsByTag(tag);
    for (let sprite of sprites) {
        if (sprite.x == x_pos && sprite.y == y_pos) return sprite;
    }
}



class CollisionHandler extends ECS.Component {
    onUpdate(delta: number, absolute: number) {
        let player = this.owner;
        const bricks = this.scene.findObjectsByTag(Tags.BOUNDARY);
        const flowers = this.scene.findObjectsByTag(Tags.FLOWER);
        const bombs = this.scene.findObjectsByTag(Tags.BOMB);
        const flames = this.scene.findObjectsByTag(Tags.FLAME);

        let colliders = [...bricks, ...flowers, ...bombs, ...flames];
        
		const playerBox = player.getBounds();
		
        for (let collider of colliders) {
            const cBox = collider.getBounds();
            if (collider.hasTag(Tags.FLAME)) {
                if (CollisionHandler.absoluteCollision(playerBox, cBox)) { 
                    player.setFlag(PlayerFlags.KILLED); 
                    console.log("player being killed!");
                }
                continue;
            }
            if (this.leftCollision(playerBox, cBox, delta * MOVE_CONST)) {
				player.setFlag(PlayerFlags.LEFT_COLLISION);
			}
			if (this.rightCollision(playerBox, cBox, delta * MOVE_CONST)) {
				player.setFlag(PlayerFlags.RIGHT_COLLISION);
			}
			if (this.upperCollision(playerBox, cBox, delta * MOVE_CONST)) {
				player.setFlag(PlayerFlags.UPPER_COLLISION);
			}
			if (this.bottomCollision(playerBox, cBox, delta * MOVE_CONST)) {
				player.setFlag(PlayerFlags.BOTTOM_COLLISION);
			}
		}
    }

    private leftCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle, step: number) {
        return (myBounds.left - step < otherBounds.right && myBounds.left > otherBounds.left) && (Math.min(myBounds.bottom, otherBounds.bottom) - Math.max(myBounds.top, otherBounds.top)) > 0;
    }

    private rightCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle, step: number) {
        return (myBounds.right + step > otherBounds.left && myBounds.right < otherBounds.right) && ((Math.min(myBounds.bottom, otherBounds.bottom) - Math.max(myBounds.top, otherBounds.top)) > 0);
    }

    private upperCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle, step: number) {
        return Math.min(myBounds.right, otherBounds.right) - Math.max(myBounds.left, otherBounds.left) > 0 && otherBounds.bottom > myBounds.top - step && otherBounds.top < myBounds.top;
    }

    private bottomCollision(myBounds: PIXI.Rectangle, otherBounds: PIXI.Rectangle, step: number) {
        return Math.min(myBounds.right, otherBounds.right) - Math.max(myBounds.left, otherBounds.left) > 0 && otherBounds.top < myBounds.bottom + step && otherBounds.bottom > myBounds.bottom;
    }

    public static horizontalIntersection(first: PIXI.Rectangle, second: PIXI.Rectangle) {
        return Math.min(first.right, second.right) - Math.max(first.left, second.left);
    }    
    public static verticalIntersection(first: PIXI.Rectangle, second: PIXI.Rectangle) {
        return Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
    }    

    public static absoluteCollision(first: PIXI.Rectangle, second: PIXI.Rectangle) {
        return (CollisionHandler.horizontalIntersection(first, second) > 0) && (CollisionHandler.verticalIntersection(first, second) > 0);
    }
}


class Bomb {
    exploded: boolean = false;
    origin: [number, number];
    explosion_size: number;
    bomb_sprite: ECS.Sprite;
    explosion_sprites: Array<ECS.Sprite> = new Array<ECS.Sprite>();
    danger_sprites: Array<ECS.Sprite> = new Array<ECS.Sprite>();
    bomb_layer: ECS.Container;
    path_layer: ECS.Container;
    explosion_time: number;
    removal_time: number;
    scene: ECS.Container;
    to_destroy: Array<[number, number]> = new Array<[number, number]>();
    to_destroy2: Array<ECS.Container> = new Array<ECS.Container>();

    constructor(scene: ECS.Container, origin: [number, number], size: number, explosion_time: number) {
        this.origin = origin;
        this.explosion_size = size; 
        this.explosion_time = explosion_time;
        this.removal_time = explosion_time + 900;
        this.scene = scene;
        this.bomb_layer = scene.getChildByName('bombLayer') as ECS.Container;
        this.path_layer = scene.getChildByName('pathLayer') as ECS.Container;
        this.plant();
    }

    plant() {
        let sprite = new ECS.Sprite('', Bomberman.createTexture(0, 24, 24, 24) );
        sprite.addTag(Tags.BOMB);
        sprite.scale.set(TEXTURE_SCALE);
        sprite.position.x = this.origin[_X];
        sprite.position.y = this.origin[_Y];

        this.bomb_layer.addChild(sprite);
        this.bomb_sprite = sprite;
        this.prepareForExplosion(-1, _X);
        this.prepareForExplosion( 1, _X);
        this.prepareForExplosion(-1, _Y);
        this.prepareForExplosion( 1, _Y);
        console.log("bomb planted!");
    }

    prepareForExplosion(direction: number, coordinate: number) {
        let flowers = this.scene.scene.findObjectsByTag(Tags.FLOWER);
        let boundaries = this.scene.scene.findObjectsByTag(Tags.BOUNDARY);
        let bombs = this.scene.scene.findObjectsByTag(Tags.BOMB);
        let ai_players = this.scene.scene.findObjectsByTag(Tags.AI);
        //for (let player of ai_players) player.resetFlag(PlayerFlags.IN_DANGER);

        let colliders = [...boundaries, ...bombs, ...flowers, ...ai_players];
        
        for (let i = this.origin[coordinate] + direction; i != this.origin[coordinate] + this.explosion_size * direction ; i += direction) {
            let currX = coordinate == _X ? i : this.origin[_X];
            let currY = coordinate == _Y ? i : this.origin[_Y];
            let currentBox = new PIXI.Rectangle(currX, currY, 1, 1);

            for (let c of colliders) {
                let bbox = c.getBounds();

                if (bbox.x == currentBox.x && bbox.y == currentBox.y) {
                    if (c.hasTag(Tags.AI)) {
                        c.setFlag(PlayerFlags.IN_DANGER);
                        c.addTag(Tags.DANGER);
                        console.log("AI in DANGER!!!!!!!!!");
                        continue;
                    }
                    if (c.hasTag(Tags.FLOWER)) {
                        this.to_destroy2.push(c);
                        if (this.to_destroy2.length == 4) { return; }
                    }
                    return;
                }
            }
            let sprite = getSpriteAtPos(currX, currY, Tags.PATH, this.scene.scene);
            sprite.addTag(Tags.DANGER);
            sprite.removeTag(Tags.PATH);
            this.danger_sprites.push(sprite as ECS.Sprite);
           
            }
    }
    

    renderExplosion() {
        for (let x of this.danger_sprites) {
            let sprite = new ECS.Sprite('', Bomberman.createTexture(96, 0, 24, 24) );
            sprite.addTag(Tags.FLAME);
            sprite.scale.set(TEXTURE_SCALE);
            sprite.position.x = x.x;
            sprite.position.y = x.y;
            this.bomb_layer.addChild(sprite);
            this.explosion_sprites.push(sprite);
            //this.path_layer.removeChild(x);
            //x.removeTag(Tags.DANGER)
        }        
        //this.danger_sprites = [];
    }

    destroyHitSprites() {
        let path_layer = this.scene.getChildByName('pathLayer') as ECS.Container;
        let flower_layer = this.scene.getChildByName('flowersLayer') as ECS.Container;

        for (let destroyed of this.to_destroy2) {
            let sprite = new ECS.Sprite('', Bomberman.createTexture(0, 0, 24, 24) );
            sprite.addTag(Tags.PATH);
            sprite.scale.set(TEXTURE_SCALE);
            sprite.position.x = destroyed.x;
            sprite.position.y = destroyed.y;
            path_layer.addChild(sprite);
            flower_layer.removeChild(destroyed);
        }
        this.to_destroy2 = [];
    }
    
    explode() {
        this.bomb_layer.removeChild(this.bomb_sprite);
    
        let sprite = new ECS.Sprite('', Bomberman.createTexture(96, 0, 24, 24) );
        sprite.addTag(Tags.FLAME);
        sprite.scale.set(TEXTURE_SCALE);
        sprite.position.x = this.origin[_X];
        sprite.position.y = this.origin[_Y];

        this.bomb_layer.addChild(sprite);
        this.explosion_sprites.push(sprite);
        this.renderExplosion();

        console.log("bomb exploded!");
        this.exploded = true;
    }
    cleanExplosion() {
            for (let expl of this.explosion_sprites) { this.bomb_layer.removeChild(expl); }
            for (let d of this.danger_sprites) { d.addTag(Tags.PATH); d.removeTag(Tags.DANGER); }
            this.destroyHitSprites();
            this.explosion_sprites = [];
            this.danger_sprites = [];
            console.log("explosion cleaned!");
        
    }
}

class Player {
    container: ECS.Container;
    speed: number = 0.007;
    max_bombs_capacity: number = 1;
    explosion_size: number = 5; 
    bombs_planted: number = 0;
    score: number = 0;
    bombs_queue: Array<Bomb> = new Array<Bomb>();

    constructor(player_object: any){
       this.container = player_object;
    }
}

enum p_contr {
    _LEFT = 0, _RIGHT = 1, _UP = 2, _DOWN = 3, _BOMB = 4
}

class PlayerController extends ECS.Component {
    player: Player;
    player_tag: string;

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

    clipMyPosition() {
        const bbox = this.owner.getBounds();
        let x_dif = bbox.x - Math.trunc(bbox.x);
        let y_dif = bbox.y - Math.trunc(bbox.y);

        if (x_dif > 0.95) this.owner.position.x = Math.ceil(this.owner.position.x);
        else if (x_dif < 0.05) this.owner.position.x = Math.floor(this.owner.position.x);

        if (y_dif > 0.95) this.owner.position.y = Math.ceil(this.owner.position.y);
        else if (y_dif < 0.05) this.owner.position.y = Math.floor(this.owner.position.y);
    }

    move(delta: number, absolute: number, controls: [ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys]) {
        const keyInputCmp = this.scene.findGlobalComponentByName<ECS.KeyInputComponent>(ECS.KeyInputComponent.name);
       
        if (keyInputCmp.isKeyPressed(controls[p_contr._LEFT])) {
            if (this.owner.hasFlag(PlayerFlags.LEFT_COLLISION)) keyInputCmp.handleKey(controls[p_contr._LEFT]);
            else this.moveLeft(delta * 0.01);
		}
		if (keyInputCmp.isKeyPressed(controls[p_contr._RIGHT])) {
            if (this.owner.hasFlag(PlayerFlags.RIGHT_COLLISION)) keyInputCmp.handleKey(controls[p_contr._RIGHT]);
            else this.moveRight(delta * 0.01);
        }
        
        if (keyInputCmp.isKeyPressed(controls[p_contr._DOWN])) {
            if (this.owner.hasFlag(PlayerFlags.BOTTOM_COLLISION)) keyInputCmp.handleKey(controls[p_contr._DOWN]);
            else this.moveDown(delta * 0.01);
        }
		if (keyInputCmp.isKeyPressed(controls[p_contr._UP])) {
            if (this.owner.hasFlag(PlayerFlags.UPPER_COLLISION)) keyInputCmp.handleKey(controls[p_contr._UP]);
            else this.moveUp(delta * 0.01);
        }
        
        if (keyInputCmp.isKeyPressed(controls[p_contr._BOMB]) ) {
            this.owner.setFlag(PlayerFlags.BOMB_TO_PLANT);
            keyInputCmp.handleKey(controls[p_contr._BOMB]);
        }
        for (let i = 1; i <= 4; i++) this.owner.resetFlag(i);

        this.clipMyPosition();
    }

    plantBomb() {
        if (this.player.bombs_planted < this.player.max_bombs_capacity) {
            let now = Date.now();
            this.player.bombs_planted++;
            let b = new Bomb(this.scene.stage, [Math.round(this.owner.position.x), Math.round(this.owner.position.y)], 
                             this.player.explosion_size, now + 1500);
            this.player.bombs_queue.push(b);
        }
    }
    updateBombs() {
        if (this.player.bombs_queue.length > 0) {
            let bomb = this.player.bombs_queue[0];

            if (bomb.explosion_time < Date.now() && !bomb.exploded) {
                bomb.explode();
            }
            else if (bomb.exploded && bomb.removal_time < Date.now()) {
                bomb.cleanExplosion();
                
                this.player.bombs_queue.shift();
                this.player.bombs_planted--;
            }
        }
    }
}

class HumanPlayerController extends PlayerController {
    controls: [ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys];
    
    constructor(controls: [ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys], player_tag: string) {
        super();
        this.controls = controls;
        this.player_tag = player_tag;
    }
    onInit() {
        this.player = new Player(this.scene.findObjectByTag(this.player_tag));
    }

    onUpdate(delta: number, absolute: number) {
        
        this.move(delta, absolute, this.controls);
        if (this.owner.hasFlag(PlayerFlags.BOMB_TO_PLANT)) {
             this.plantBomb(); 
             this.owner.resetFlag(PlayerFlags.BOMB_TO_PLANT);
        }
        this.updateBombs();
        if (this.owner.hasFlag(PlayerFlags.KILLED) && this.player.bombs_queue.length == 0) {
        
            this.owner.scene.stage.removeChild(this.owner);
        }
    }
}

class AIController extends PlayerController {
    safe_tile : ECS.Container;
    is_safetile_set: boolean = false;
    is_moving : boolean = false;
    sourcepos : [number, number];
    constructor(player_tag: string) {
        super();
        this.player_tag = player_tag;
    }

    onInit() {
        this.player = new Player(this.scene.findObjectByTag(this.player_tag));
    }

    onUpdate(delta: number, absolute: number) {
      
        if (!this.isSafe()) {
            // todo : find safe place
            if (!this.is_safetile_set) {
                this.sourcepos = [Math.round(this.owner.x), Math.round(this.owner.y)];
                this.is_safetile_set = true;
                
            }
            let left = getSpriteAtPos(this.sourcepos[0], this.sourcepos[1], Tags.PATH, this.owner.scene);
            let right =getSpriteAtPos(this.sourcepos[0], this.sourcepos[1], Tags.PATH, this.owner.scene);
            let up =   getSpriteAtPos(this.sourcepos[0], this.sourcepos[1], Tags.PATH, this.owner.scene);
            let down = getSpriteAtPos(this.sourcepos[0], this.sourcepos[1], Tags.PATH, this.owner.scene);
                    
            if (!this.owner.hasFlag(PlayerFlags.RIGHT_COLLISION) && right) {this.moveRight(delta*0.01);  this.is_safetile_set = true; return; }
            if (!this.owner.hasFlag(PlayerFlags.LEFT_COLLISION) && left)   {this.moveLeft (delta*0.01);  this.is_safetile_set = true; return; }
            if (!this.owner.hasFlag(PlayerFlags.UPPER_COLLISION) && up)    {this.moveUp   (delta*0.01);  this.is_safetile_set = true; return; }
            if (!this.owner.hasFlag(PlayerFlags.BOTTOM_COLLISION) && down) {this.moveDown (delta*0.01);  this.is_safetile_set = true; return; }
                
        } else {
            this.is_safetile_set = false;
            this.owner.removeTag(Tags.DANGER);
            this.owner.resetFlag(PlayerFlags.IN_DANGER);
            // todo : other interesting things
        }

    }

    isSafe() {
        return !this.owner.hasFlag(PlayerFlags.IN_DANGER) || !this.owner.hasTag(Tags.DANGER);
    }

    getSafeTile() {
        
        let path_layer = this.owner.parent.getChildByName('pathLayer') as ECS.Container;
        for (let tile of path_layer.children) {
            let t = tile as ECS.Sprite;
            if (t.hasTag(Tags.PATH) && (Math.abs(t.x - this.owner.x) < 4 && Math.abs(t.y - this.owner.y) < 4)) {
                console.log("Safety is at: ", t.x, " ", t.y);
                return t;
            }
        }
    }
}

class Bomberman {
    engine: ECS.Engine;

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

        new ECS.Builder(this.engine.scene)
        .anchor(0)
        .localPos(1, SCENE_HEIGHT - 3)
        .withTag(Tags.PLAYER3)
        .withTag(Tags.AI)
        .asSprite(Bomberman.createTexture(24, 24, 24, 24))
        .withParent(this.engine.scene.stage)
        .withComponent(new CollisionHandler())
        .withComponent(new AIController(Tags.AI))
        .scale(TEXTURE_SCALE)
        .build();

        new ECS.Builder(this.engine.scene)
        .anchor(0)
        .localPos(SCENE_WIDTH - 2, SCENE_HEIGHT - 3)
        .withTag(Tags.PLAYER4)
        .withTag(Tags.AI)
        .asSprite(Bomberman.createTexture(72, 24, 24, 24))
        .withParent(this.engine.scene.stage)
        .withComponent(new CollisionHandler())
        .withComponent(new AIController(Tags.AI))
        .scale(TEXTURE_SCALE)
        .build();

    }

    private generateMap(path: ECS.Container, flowers: ECS.Container, walls: ECS.Container) {
        for (let i = 1; i < SCENE_WIDTH - 1; i++) {
            for (let j = 1; j < SCENE_HEIGHT - 2; j++) {
                
                let x = Math.random() * 100;
                if ((i == 1 && j == 1) || (i == 18 && j == 1) || (i == 18 && j == 13) || (i == 1 && j == 13) ) {
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

    public static createTexture(offsetX: number, offsetY: number, width: number, height: number) {
        let texture = PIXI.Texture.from('spritesheet');
        texture = texture.clone();
        texture.frame = new PIXI.Rectangle(offsetX, offsetY, width, height);
        return texture;
    }
}

export default new Bomberman();