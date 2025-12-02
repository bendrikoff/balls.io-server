import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, Food } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {

  maxClients = 4;
  fixedTimeStep = 50; // 20 Hz

  worldWidth = 4000;
  worldHeight = 4000;

  onCreate(options: any) {

    this.setState(new MyRoomState());

    // создать стартовую еду
    for (let i = 0; i < 100; i++) {
      this.spawnFood("food_" + i);
    }

    // симуляция
    let accumulated = 0;

    this.setSimulationInterval((dt) => {
      accumulated += dt;
      while (accumulated >= this.fixedTimeStep) {
        accumulated -= this.fixedTimeStep;
        this.fixedTick(this.fixedTimeStep / 1000);
      }
    });

    // input от клиента
    this.onMessage(0, (client, input) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.latestInput = input;
    });
  }

  spawnFood(id: string) {
    const food = new Food();

    food.x = Math.random() * 4000;
    food.y = Math.random() * 4000;
    food.radius = 10;
    food.color = Math.floor(Math.random() * 0xffffff);

    this.state.foods.set(id, food);
  }

fixedTick(dt: number) {
  const SPEED = 500;

  // движение всех игроков
  this.state.players.forEach((player) => {

    let input = player.latestInput;
    if (!input) return;

    let vx = 0, vy = 0;

    if (input.left) vx -= 1;
    if (input.right) vx += 1;
    if (input.up) vy -= 1;
    if (input.down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;
    }

    player.x += vx * SPEED * dt;
    player.y += vy * SPEED * dt;

    // world bounds
    const minX = player.radius;
    const maxX = this.worldWidth - player.radius;
    const minY = player.radius;
    const maxY = this.worldHeight - player.radius;

    player.x = Math.max(minX, Math.min(maxX, player.x));
    player.y = Math.max(minY, Math.min(maxY, player.y));
  });

  // --------------- FOOD COLLISION -------------------
  this.state.players.forEach((player) => {
    this.state.foods.forEach((food, foodId) => {
      const dx = player.x - food.x;
      const dy = player.y - food.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.radius + food.radius) {
        this.state.foods.delete(foodId);
        player.radius += food.radius * 0.1;
        this.spawnFood(foodId);
      }
    });
  });

  // --------------- PLAYER vs PLAYER EATING -------------------
  const toDelete: string[] = [];

  this.state.players.forEach((pA, idA) => {
    this.state.players.forEach((pB, idB) => {

      if (idA === idB) return;

      if (pA.radius <= pB.radius * 1.15) return;

      const dx = pA.x - pB.x;
      const dy = pA.y - pB.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < pA.radius - pB.radius * 0.2) {

        pA.radius += pB.radius * 0.25;
        toDelete.push(idB);
      }

    });
  });

  toDelete.forEach(id => this.state.players.delete(id));
}


  onJoin(client: Client, options: any) {
    const player = new Player();
    player.x = Math.random() * 800;
    player.y = Math.random() * 600;
    player.radius = 50;
    player.color = Player.getRandomColor();
    player.latestInput = null;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }
}
