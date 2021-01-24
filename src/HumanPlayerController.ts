import * as ECS from '../libs/pixi-ecs';
import {PlayerController} from './PlayerController'
import { Tags, TEXTURE_SCALE, _X, _Y, GameState, PlayerFlags, createTexture } from './Common'
import { Player } from './Player' 

export class HumanPlayerController extends PlayerController {
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
        this.updateGameState();
        if (window.gs != GameState.RUNNING) return;
        this.move(delta, absolute, this.controls);
        if (this.owner.hasFlag(PlayerFlags.BOMB_TO_PLANT)) {
             this.plantBomb(); 
             this.owner.resetFlag(PlayerFlags.BOMB_TO_PLANT);
        }
        this.updateBombs();
        if (this.owner.hasFlag(PlayerFlags.KILLED) && this.player.bombs_queue.length == 0) {
            this.owner.scene.stage.removeChild(this.owner);
            window.gs = GameState.GAME_OVER;
            let xxx = new ECS.Container('xxx');
            this.scene.stage.addChild(xxx);

            let sprite = new ECS.Sprite('', createTexture(0, 0, 800, 600, 'game_over'));
            sprite.position.x = 0;
            sprite.position.y = 0;
            sprite.scale.set(TEXTURE_SCALE * 0.6);

            xxx.addChild(sprite);
            let winner = this.player_tag == Tags.PLAYER1 ? 'player2' : 'player1';

            let text = new PIXI.Text(winner + ' WON',
            {fontWeight : 'bold', letterSpacing : 0.75, fontFamily : 'Arial', fontSize: 3, fill : 0xee33ff, align : 'right'});
            text.scale.set(0.5);
            text.position.x = text.position.x + 2;
            text.position.y = text.position.y + 3;
            xxx.addChild(text); 
        }
    }
}