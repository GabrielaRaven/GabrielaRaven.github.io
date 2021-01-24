import * as ECS from '../libs/pixi-ecs';
import { Bomb } from './Bomb'
import { p_contr, PlayerFlags, SCENE_WIDTH, SCENE_HEIGHT, _X, _Y, GameState } from './Common'
import { Player } from './Player'

export class PlayerController extends ECS.Component {
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

    updateGameState() {
        if (window.gs != GameState.START) return;

        const keyInputCmp = this.scene.findGlobalComponentByName<ECS.KeyInputComponent>(ECS.KeyInputComponent.name);
        if (keyInputCmp.isKeyPressed(ECS.Keys.KEY_S)) {
            keyInputCmp.handleKey(ECS.Keys.KEY_S);
            let a = this.scene.stage.getChildByName('xxx');
            
            this.scene.stage.removeChild(a);
            a.destroy();
            window.gs = GameState.RUNNING;
            console.log("GAME IS RUNNING!!!");
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