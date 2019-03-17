const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

const users = require("./routes/api/users");

const app = express();
const server = require("http").Server(app);

const io = require("socket.io")(server);

let rooms = 0;
let hostnames = [];
let betArray = [];
let scoreArray = [];
let userid = 0;
let room_id = [];

app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

const db = require("./config/keys").mongoURI;

mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Routes
app.use("/routes/api/users", users);
//next three socket test
app.use(express.static("."));

app.use(express.static('../client/step1/build/contracts'));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/src/index.html`);
});

//socket stuff
io.on("connection", socket => {
  // Create a new game room and notify the creator of game.
  socket.on("createGame", data => {
    socket.join(rooms);
    userid = room_id.length;
    hostnames.push(data.name);
    betArray.push(data.amountBet);
    socket.emit("newGame", { name: data.name, room: rooms, isHost: "true" });
    rooms++;
    room_id.push(rooms);
  });

  socket.on("leaveRoom", data => {
    console.log("host left room");
    socket.leave({ rooms });
    if (rooms != 0) {
      rooms--;
    }
    hostnames.splice(data.id, 1);
    betArray.splice(data.id, 1);
    room_id.splice(data.id, 1);
    scoreArray.splice(data.id, 1);
  });

  // Connect the Player 2 to the room he requested. Show error if room full.
  socket.on("joinGame", function(data) {
    var room = io.nsps["/"].adapter.rooms[data.id];
    if (room && room.length === 1) {
      socket.join(data.id);
      io.emit("gameReady", {name:data.name, names:hostnames, bets: betArray, id: data.id });
    } else {
      socket.emit("err", { message: "Sorry, The room is full!" });
    }
  });

  socket.on("viewLobby", function() {
    socket.emit("receiveLobby", { names: hostnames, bets: betArray, ids: room_id});
  });

  socket.on("sendScore", function(data) {
    if ( typeof scoreArray[data.id] == 'undefined') {
      console.log("test for undefined");
      scoreArray[data.id] = data.score;
    }
    else {
      if (data.score > scoreArray[data.id]){
        console.log("winner");
        socket.emit("gameWin");
        socket.to(data.id).emit("gameLose");
      }
      else if (data.score === scoreArray[data.id]){
        console.log("tie");
        io.emit("gameTie");
      }
      else {
        console.log("loser");
        socket.emit("gameLose");
        socket.to(data.id).emit("gameWin");
      }
    }
  });

  const chatMessage = text => {
    return {
      text
    };
  };
});

server.listen(5000);

const port = process.env.PORT || 5000;
