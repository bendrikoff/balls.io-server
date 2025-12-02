import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") radius: number = 30;
    @type("number") color: number = 0xffffff;
    @type("string") username: string = "";

    // ❗ Colyseus schema НЕ может сериализовать input, поэтому делаем обычное поле
    latestInput: {
        left?: boolean,
        right?: boolean,
        up?: boolean,
        down?: boolean
    } | null = null;

    static getRandomColor(): number {
        const r = Math.floor((Math.random() * 127) + 127);
        const g = Math.floor((Math.random() * 127) + 127);
        const b = Math.floor((Math.random() * 127) + 127);
        return (r << 16) + (g << 8) + b;
    }
}

export class Food extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") color: number = 0x00ff00;
    @type("number") radius: number = 10;
}

export class MyRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type({ map: Food }) foods = new MapSchema<Food>();

}