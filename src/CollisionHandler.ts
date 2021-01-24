import * as ECS from '../libs/pixi-ecs';
import { Tags, PlayerFlags, _X, _Y, MOVE_CONST } from './Common'


export class CollisionHandler extends ECS.Component {
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