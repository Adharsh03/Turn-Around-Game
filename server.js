const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, "index.html")));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


let gameState = {
    A: {
        characters: ['P1', 'P2', 'H1', 'H2', 'P3'],
        positions: [
            ['A-P1', 'A-P2', 'A-H1', 'A-H2', 'A-P3'],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['B-P1', 'B-P2', 'B-H1', 'B-H2', 'B-P3']
        ]
    },
    B: {
        characters: ['P1', 'P2', 'H1', 'H2', 'P3']
    },
    turn: 'A'
};

// Serve static files (index.html, style.css, script.js)

// WebSocket Connection
wss.on('connection', (ws) => {
    console.log('Player connected');

    // Send initial game state to the client
    ws.send(JSON.stringify({ type: 'init', gameState }));

    // Handle incoming messages (moves)
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received:', data);

        if (data.type === 'move') {
            handleMove(data.character, data.move);
            broadcastGameState();
        }
    });

    // Handle WebSocket disconnection
    ws.on('close', () => {
        console.log('Player disconnected');
    });
});

// Handle move logic
function handleMove(character, move) {
    // Simplified movement logic
    // Update the gameState based on character and move
    console.log(`${character} moved ${move}`);

    // Switch turn after move
    gameState.turn = gameState.turn === 'A' ? 'B' : 'A';
}

// Broadcast game state to all connected clients
function broadcastGameState() {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'update', gameState }));
        }
    });
}

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


app.get("/", (req,res)=> {
    res.sendFile((path.join(__dirname, "index.html")))
  })
  