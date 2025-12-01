import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import cors from "cors";

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom";

export default config({

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom);
    },

    initializeExpress: (app) => {

        // ⭐️⭐️⭐️ ВАЖНО: Добавляем CORS для всех запросов ⭐️⭐️⭐️
        app.use(cors({
            origin: "*",          // можно указать домен: "https://remix.gg"
            methods: ["GET", "POST", "OPTIONS"],
            credentials: false
        }));

        // или super-простой вариант:
        // app.use(cors());

        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground());
        }

        app.use("/monitor", monitor());
    },

    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
