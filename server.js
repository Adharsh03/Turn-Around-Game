const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Initialize express app
const app = express();

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "index.html")));

// Create an HTTP server and wrap it with WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Game state
let players = {};
let gameState = createInitialGameState();

// Create the initial game state with a 5x5 grid
function createInitialGameState() {
  return {
    grid: Array(5).fill().map(() => Array(5).fill(null)), // 5x5 grid
    turn: 'A', // Player A starts first
  };
}

wss.on('connection', function connection(ws) {
  // Assign player ID
  const playerId = Object.keys(players).length === 0 ? 'A' : 'B';
  players[playerId] = ws;

  // Send initial game state to the player
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
    gameState.turn = gameState.turn === 'A' ? 'B' : 'A'; // Switch turn
  } else {
    players[playerId].send(JSON.stringify({ type: 'invalid', message: 'Invalid move' }));
  }
}

function validateMove(character, move) {
  // Implement validation logic here (e.g., bounds checking, move legality)
  return true; // For now, we'll accept any move
}

function updateGameState(character, move) {
  // Update the grid based on the move, e.g., move a character on the grid
  const [newX, newY] = move;
  gameState.grid[newX][newY] = character;
}

function broadcastGameState() {
  const stateUpdate = JSON.stringify({ type: 'update', gameState });
  for (let player in players) {
    players[player].send(stateUpdate);
  }
}

// Start the server on port 8080
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


app.get("/", (req,res)=> {
  res.sendFile((path.join(__dirname, "index.html")))
})
