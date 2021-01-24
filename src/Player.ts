import * as ECS from '../libs/pixi-ecs';
import { _X, _Y } from './Common'
import { Bomb } from './Bomb'

export class Player {
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