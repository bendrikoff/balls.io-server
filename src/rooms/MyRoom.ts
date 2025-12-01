import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  state = new MyRoomState();

 
  onCreate(options: any) {
    // handle player input
    this.onMessage(0, (client, payload) => {
      // get reference to the player who sent the message
      const player = this.state.players.get(client.sessionId);
      const velocity = 2;
 
      if (payload.left) {
        player.x -= velocity;
 
      } else if (payload.right) {
        player.x += velocity;
      }
 
      if (payload.up) {
        player.y -= velocity;
 
      } else if (payload.down) {
        player.y += velocity;
      }
    });
  }
  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const mapWidth = 800;
    const mapHeight = 600;

    // create Player instance
    const player = new Player();

    // place Player at a random position
    player.x = (Math.random() * mapWidth);
    player.y = (Math.random() * mapHeight);
    player.radius = 50;
    player.color = 0xffffff;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players.delete(client.sessionId);
  }
  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
