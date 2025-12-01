import { MapSchema, Schema, type } from "@colyseus/schema";
 
export class Player extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("number") radius: number;
    @type("number") color: number;
}
 
export class MyRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
}