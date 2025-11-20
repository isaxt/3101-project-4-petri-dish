import express from "express";
import expressWs from "express-ws";

// create a server
const server = express();
// added websocket features
expressWs(server);

const port = 3000;

let clients = {};
let messages = [];
let global_id = 0;

// petri dish-- mold simulator state
let currentEnvironment = {
  environment: 50,
  time: 50,
  temperature: 50
};
let currentMolds = [];

// set up a websocket endpoint
server.ws("/", (client) => {
  // figure out the client's id
  let id = global_id++;

  console.log(`${id} connected`);

  // send a welcome message with current state
  send(client, {
    type: "welcome",
    id,
    connected: Object.keys(clients).map(Number),
    messages,
  });

  // send current environment and mold state to new client
  send(client, {
    type: "environment_update",
    ...currentEnvironment,
  });

  send(client, {
    type: "mold_placed",
    molds: currentMolds,
  });

  broadcast({ type: "connected", id });

  clients[id] = client;

  client.on("message", (dataString) => {
    let event = JSON.parse(dataString);

    if (event.type === "client_message") {
      let { content } = event;

      let message = { content, time: Date.now(), sender: id };

      messages.push(message);

      broadcast({
        type: "server_message",
        ...message,
      });
    } 
    else if (event.type === "environment_update") {
      // update server's environment state
      currentEnvironment = {
        environment: event.environment,
        time: event.time,
        temperature: event.temperature,
      };

      console.log(`Environment updated by ${id}:`, currentEnvironment);

      // broadcast to all clients
      broadcast({
        type: "environment_update",
        ...currentEnvironment,
      });
    }
    else if (event.type === "mold_placed") {
      // update server's mold state
      currentMolds = event.molds;

      console.log(`Mold placed by ${id}. Total molds: ${currentMolds.length}`);

      // broadcast to all clients
      broadcast({
        type: "mold_placed",
        molds: currentMolds,
      });
    }
    else if (event.type === "clear_dish") {
      // clear all the molds
      currentMolds = [];

      console.log(`Dish cleared by ${id}`);

      // broadcast to all clients
      broadcast({
        type: "clear_dish",
      });
    }
  });

  client.on("close", () => {
    console.log(`${id} disconnected`);
    delete clients[id];
    broadcast({ type: "disconnected", id });
  });
});

// start the server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});

function send(client, message) {
  client.send(JSON.stringify(message));
}

function broadcast(message) {
  for (let client of Object.values(clients)) {
    send(client, message);
  }
}