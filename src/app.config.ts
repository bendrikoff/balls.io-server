import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import cors from "cors";
import { Request, Response, NextFunction } from "express";

import { MyRoom } from "./rooms/MyRoom";

export default config({
initializeGameServer: (gameServer) => {
  const transport: any = gameServer.transport;
  if (transport.app) {
    transport.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }

      next();
    });
  }

  gameServer.define("my_room", MyRoom);
},

  initializeExpress: (app) => {
    // это для твоих кастомных роутов (/hello_world, /monitor, playground)
    app.use(cors());

    app.get("/hello_world", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground());
    }

    app.use("/monitor", monitor());
  },

  beforeListen: () => {
    // можно оставить пустым
  }
});
