import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, Food } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {

  maxClients = 10;
  fixedTimeStep = 50; // 20 Hz

  worldWidth = 4000;
  worldHeight = 4000;

  bots: string[] = [];
  botCounter = 1; // Bot#1, Bot#2, …

  onCreate(options: any) {

    this.setState(new MyRoomState());

    // создать стартовую еду
    for (let i = 0; i < 100; i++) {
      this.spawnFood("food_" + i);
    }

    // игровой цикл (fixed tick)
    let accumulated = 0;

    this.setSimulationInterval((dt) => {
      accumulated += dt;
      while (accumulated >= this.fixedTimeStep) {
        accumulated -= this.fixedTimeStep;
        this.fixedTick(this.fixedTimeStep / 1000);
      }
    });

    // input от клиентов
    this.onMessage(0, (client, input) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      player.latestInput = input;
    });
  }

  // ---------------------------------------
  // FOOD
  // ---------------------------------------

  spawnFood(id: string) {
    const food = new Food();

    food.x = Math.random() * this.worldWidth;
    food.y = Math.random() * this.worldHeight;
    food.radius = 10;
    food.color = Math.floor(Math.random() * 0xffffff);

    this.state.foods.set(id, food);
  }

  // ---------------------------------------
  // BOTS
  // ---------------------------------------
  createBot() {
    const id = "bot_" + Math.random().toString(36).slice(2);

    const bot = new Player();
    bot.x = Math.random() * this.worldWidth;
    bot.y = Math.random() * this.worldHeight;
    bot.radius = 50;
    bot.color = Player.getRandomColor();
    bot.isBot = true;
    bot.latestInput = null;

    // ✔ Имя присваивается один раз и больше никогда не меняется
    bot.username = `Bot#${this.botCounter++}`;

    this.state.players.set(id, bot);
    this.bots.push(id);

    console.log("BOT CREATED:", bot.username);
  }

  // ---------------------------------------
  // FIXED UPDATE
  // ---------------------------------------

  fixedTick(dt: number) {
    const SPEED = 500;

    // автоспавн ботов (до 10 игроков в комнате)
    if (this.state.players.size < 10) {
      this.createBot();
    }

    // ---------------- движение обычных игроков ----------------
    this.state.players.forEach((player) => {

      if (player.isBot) return;

      const input = player.latestInput;
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

// ---------------- BOT AI ----------------
this.bots.forEach(botId => {
  const bot = this.state.players.get(botId);
  if (!bot) return;

  const BOT_SPEED = 320;
  const BOT_VIEW_RANGE = 600;
  const BOT_RANDOM_MOVE_CHANCE = 0.25;
  const BOT_REACTION_DELAY = 150;

  // нужно ли обновлять решение?
  const shouldUpdate =
    !bot.reactionTimer || Date.now() >= bot.reactionTimer;

  if (shouldUpdate) {

    bot.reactionTimer = Date.now() + BOT_REACTION_DELAY;

    // ---- 1. Рандомное блуждание ----
    if (Math.random() < BOT_RANDOM_MOVE_CHANCE) {
      bot.latestInput = {
        left: Math.random() < 0.5,
        right: Math.random() < 0.5,
        up: Math.random() < 0.5,
        down: Math.random() < 0.5,
      };
    } else {

      // ---- 2. Ищем еду ----
      let closest = null;
      let distMin = Infinity;

      this.state.foods.forEach(food => {
        const dx = food.x - bot.x;
        const dy = food.y - bot.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < distMin && dist < BOT_VIEW_RANGE) {
          distMin = dist;
          closest = food;
        }
      });

      // ---- 3. Если еды нет — идём случайно ----
      if (!closest) {
        bot.latestInput = {
          left: Math.random() < 0.3,
          right: Math.random() < 0.3,
          up: Math.random() < 0.3,
          down: Math.random() < 0.3,
        };
      } else {
        // ---- 4. Направление на еду с помехами ----
        const dx = closest.x - bot.x;
        const dy = closest.y - bot.y;

        bot.latestInput = {
          left: dx < -20,
          right: dx > 20,
          up: dy < -20,
          down: dy > 20,
        };
      }
    }
  }

  // ---- 5. ВСЕГДА применять движение ----
  const input = bot.latestInput;
  if (!input) return;

  let vx = 0, vy = 0;

  if (input.left) vx -= 1;
  if (input.right) vx += 1;
  if (input.up) vy -= 1;
  if (input.down) vy += 1;

  if (vx !== 0 || vy !== 0) {
    const len = Math.sqrt(vx*vx + vy*vy);
    vx /= len;
    vy /= len;
  }

  bot.x += vx * BOT_SPEED * dt;
  bot.y += vy * BOT_SPEED * dt;

});


    // ---------------- FOOD COLLISION ----------------
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

    // ---------------- PLAYER vs PLAYER EATING ----------------
    const toDelete: string[] = [];

    this.state.players.forEach((pA, idA) => {
      this.state.players.forEach((pB, idB) => {

        if (idA === idB) return;

        if (pA.radius <= pB.radius * 1.15) return;

        const dx = pA.x - pB.x;
        const dy = pA.y - pB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pA.radius - pB.radius * 0.2) {
          pA.radius += pB.radius * 0.25;
          toDelete.push(idB);
        }
      });
    });

    // удаляем жертв
    toDelete.forEach(id => {
      this.state.players.delete(id);

      // если это бот — убрать из списка
      if (this.bots.includes(id)) {
        this.bots = this.bots.filter(b => b !== id);
      }
    });
  }

  // ---------------------------------------
  // CLIENT HANDLERS
  // ---------------------------------------

  onJoin(client: Client, options: any) {
    const player = new Player();

    player.x = Math.random() * 800;
    player.y = Math.random() * 600;
    player.radius = 50;
    player.color = Player.getRandomColor();
    player.latestInput = null;

    player.isBot = false;
    player.username = options.username || "Player";

    this.state.players.set(client.sessionId, player);
  }


  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }
}
