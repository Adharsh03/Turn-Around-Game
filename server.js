const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, "index.html")));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
let gameState = createInitialGameState();

function createInitialGameState() {
  return {
    grid: Array(5).fill().map(() => Array(5).fill(null)), 
    turn: 'A', 
  };
}

wss.on('connection', function connection(ws) {
  const playerId = Object.keys(players).length === 0 ? 'A' : 'B';
  players[playerId] = ws;

  ws.send(JSON.stringify({ type: 'init', playerId, gameState }));

  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    handlePlayerMove(playerId, data);
  });

  ws.on('close', function () {
    delete players[playerId];
  });
});

function handlePlayerMove(playerId, data) {
  if (playerId !== gameState.turn) {
    players[playerId].send(JSON.stringify({ type: 'invalid', message: 'Not your turn' }));
    return;
  }

  const { character, move } = data;
  const validMove = validateMove(character, move);

  if (validMove) {
    updateGameState(character, move);
    broadcastGameState();
    gameState.turn = gameState.turn === 'A' ? 'B' : 'A';
  } else {
    players[playerId].send(JSON.stringify({ type: 'invalid', message: 'Invalid move' }));
  }
}

function validateMove(character, move) {
  return true; 
}

function updateGameState(character, move) {
  const [newX, newY] = move;
  gameState.grid[newX][newY] = character;
}

function broadcastGameState() {
  const stateUpdate = JSON.stringify({ type: 'update', gameState });
  for (let player in players) {
    players[player].send(stateUpdate);
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


app.get("/", (req,res)=> {
  res.sendFile((path.join(__dirname, "index.html")))
})
