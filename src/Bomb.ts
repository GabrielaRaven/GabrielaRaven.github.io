import * as ECS from '../libs/pixi-ecs';
import { Tags, TEXTURE_SCALE, PlayerFlags, _X, _Y, getSpriteAtPos, createTexture } from './Common'

export class Bomb {
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
        let sprite = new ECS.Sprite('', createTexture(0, 24, 24, 24) );
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
            let sprite = new ECS.Sprite('', createTexture(96, 0, 24, 24) );
            sprite.addTag(Tags.FLAME);
            sprite.scale.set(TEXTURE_SCALE);
            sprite.position.x = x.x;
            sprite.position.y = x.y;
            this.bomb_layer.addChild(sprite);
            this.explosion_sprites.push(sprite);
        }        
    }

    destroyHitSprites() {
        let path_layer = this.scene.getChildByName('pathLayer') as ECS.Container;
        let flower_layer = this.scene.getChildByName('flowersLayer') as ECS.Container;

        for (let destroyed of this.to_destroy2) {
            let sprite = new ECS.Sprite('', createTexture(0, 0, 24, 24) );
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
    
        let sprite = new ECS.Sprite('', createTexture(96, 0, 24, 24) );
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