import * as ECS from '../libs/pixi-ecs';

export const SCENE_WIDTH = 20;
export const SCENE_HEIGHT = 16;
export const TEXTURE_SCALE = SCENE_WIDTH / (20 * 24);
export const MOVE_CONST = 0.005;
export const _X = 0;
export const _Y = 1;
export enum GameState { START, RUNNING, GAME_OVER }
//export let gs: GameState;
export const FIRST_PLAYER_CONTROLS:  [ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys] 
                            = [ECS.Keys.KEY_LEFT, ECS.Keys.KEY_RIGHT, ECS.Keys.KEY_UP, ECS.Keys.KEY_DOWN, ECS.Keys.KEY_SPACE];
export const SECOND_PLAYER_CONTROLS: [ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys, ECS.Keys]
                            = [ECS.Keys.KEY_A, ECS.Keys.KEY_D, ECS.Keys.KEY_W, ECS.Keys.KEY_S, ECS.Keys.KEY_SHIFT];

export enum Tags {
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

export enum PlayerFlags {
	LEFT_COLLISION = 1, RIGHT_COLLISION = 2, UPPER_COLLISION = 3, BOTTOM_COLLISION = 4, BOMB_TO_PLANT = 5, KILLED = 6, IN_DANGER = 7
}

export enum p_contr {
    _LEFT = 0, _RIGHT = 1, _UP = 2, _DOWN = 3, _BOMB = 4
}

export function getSpriteAtPos(x_pos: number, y_pos: number, tag: string, scene: ECS.Scene) {
    let sprites = scene.findObjectsByTag(tag);
    for (let sprite of sprites) {
        if (sprite.x == x_pos && sprite.y == y_pos) return sprite;
    }
}

export function createTexture(offsetX: number, offsetY: number, width: number, height: number, name: string = 'spritesheet') {
    let texture = PIXI.Texture.from(name);
    texture = texture.clone();
    texture.frame = new PIXI.Rectangle(offsetX, offsetY, width, height);
    return texture;
}