import React, { Component } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import diceLogo from "../../images/dice.png";
import io from "socket.io-client";
import $ from "jquery";
import PropTypes from "prop-types";
import Web3 from "web3";
import TruffleContract from "truffle-contract";
import artifact from "../../utils/contractData.json";

const socket = io.connect("http://localhost:5000");

class Game extends Component {
  constructor(props) {
    super(props);

    this.state = {
      player1: "Finding Opponent...",
      player2: "Finding Opponent...",
      userid: "",
      isHost: "False",
      web3Provider: null,
      contracts: {},
      addresser: {},
      InputAmount: 0,
      account: {},
      rolledNumber: null
    };
  }

  componentDidMount() {
    //get web 3 initiate truffle contract set address
    let web3 = window.web3;
    web3 = new Web3(web3.currentProvider);
    let abstraction = TruffleContract(artifact);
    abstraction.setProvider(web3.currentProvider);
    this.setState({ contracts: abstraction });

    const networks = Object.keys(artifact.networks);
    const network = networks[networks.length - 1];
    const address = artifact.networks[network].address;
    this.setState({ addresser: address });

    return new Promise((resolve, reject) => {
      this.getAccount(web3)
        .then(account => {
          this.setState({ account: account });
          return abstraction.at(address);
        })
        .then(abstraction => {
          this.setState({ contracts: abstraction });
          resolve(abstraction);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  componentWillMount() {
    //when both players have joined game
    socket.on("gameReady", data => {
      this.setState({ player2: data.name });
      this.setState({ player1: data.names[data.id] });
      this.setState({ InputAmount: data.bets[data.id] });
      const message = `${this.state.player1} vs ${this.state.player2}`;
      this.displayGame(message);
      $("#confirmTransaction").css("display", "block");
      let convertedBet = this.state.InputAmount * 1000000000000000000;

      this.state.contracts
        .getNewbet(convertedBet, {
          from: this.state.account,
          gas: 1000000,
          value: convertedBet
        })
        .then(randomnumber => {
          let destiny = randomnumber.logs[0].args.currentBet.toNumber();
          this.setState({ rolledNumber: destiny });
          $(".game").css("display", "block");
          $("#confirmTransaction").css("display", "none");
          this.setState({ userid: data.id });
        });
    });

    //when game is won
    socket.on("gameWin", data => {
      console.log("I WON WOOHOO");
      $("#gameWaiting").css("display", "none");
      const message = `You Won! Congratulations!`;
      $("#gameResult").html(message);

      this.state.contracts.distributeWinnings({
        from: this.state.account,
        gas: 1000000
      });
      $("#linkBack").css("display", "block");
    });

    socket.on("gameTie", data => {
      console.log("Tie");
      $("#gameWaiting").css("display", "none");
      const message = `Draw!`;
      $("#gameResult").html(message);

      this.state.contracts.distributeTie({
        from: this.state.account,
        gas: 1000000
      });
      $("#linkBack").css("display", "block");
    });

    socket.on("gameLose", data => {
      console.log("Lose");
      $("#gameWaiting").css("display", "none");
      const message = `You lose. Better luck next time.`;
      $("#gameResult").html(message);
      $("#linkBack").css("display", "block");
    });

    //when user clicks view lobby
    socket.on("receiveLobby", data => {
      let userarray = data.names;
      let betsarray = data.bets;
      let x;
      let table = document.getElementById("lobbyTable");

      const { user } = this.props.auth;
      const name = user.name;

      for (x = 0; x < userarray.length; x++) {
        var btn = document.createElement("input");
        btn.style = "width:150px";
        btn.type = "button";
        btn.name = x;
        btn.id = x;
        btn.value = "Join";
        btn.onclick = function() {
          testFunction(this.id);
        };
        function testFunction(id) {
          socket.emit("joinGame", { name, id });
          socket.emit("sendPlayer2", name);
        }

        btn.className =
          "btn btn-med waves-effect waves-light hoverable blue accent-3";
        var row = table.insertRow(1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        cell1.innerHTML = userarray[x];
        cell2.innerHTML = betsarray[x];
        cell3.appendChild(btn);
      }

      this.displayLobby();
    });

    //when user clicks create game
    socket.on("newGame", data => {
      const message = `Hello, ${data.name}.
       Searching for opponent...`;
      this.setState({ player1: data.name });
      this.setState({ isHost: data.isHost });
      this.displayGame(message);
    });

    //when host leaves
    let onLeave = () => {
      if (this.state.isHost === "true") {
        let id = this.state.userid;
        socket.emit("leaveRoom", { id });
      }
    };

    window.onbeforeunload = onLeave;
  }

  displayLobby() {
    $("#content").css("display", "none");
    $(".lobby").css("display", "block");
  }

  displayGame(message) {
    $(".gameBoard").css("display", "block");
    $("#content").css("display", "none");
    $(".lobby").css("display", "none");
    $(".betInput").css("display", "none");
    $("#notification").html(message);
  }

  displayBetInput() {
    $("#content").css("display", "none");
    $(".betInput").css("display", "block");
  }

  showRoll(sender, score) {
    $("#resultLoading").css("display", "none");
    $("#scoreText").css("display", "block");
    $("#gameResult").css("display", "block");
    $("#gameWaiting").css("display", "block");
    let senderId = sender;
    let destiny = score;
    socket.emit("sendScore", { score: destiny, id: senderId });
  }

  displayResult(message) {
    $("#gameResult").html(message);
  }

  getAccount = web3 => {
    return new Promise((resolve, reject) => {
      web3.eth.getAccounts((error, accounts) => {
        resolve(accounts[0]);
      });
    });
  };

  onJoinClick = f => {
    f.preventDefault();
    const { user } = this.props.auth;
    const name = user.name;
    this.setState({ player2: name });
    socket.emit("joinGame", { name });
    socket.emit("sendPlayer2", name);
  };

  onCreateClick = f => {
    f.preventDefault();
    this.displayBetInput();
  };

  handleInputChange = e => {
    this.setState({ InputAmount: e.target.value });
  };

  onSubmit = e => {
    e.preventDefault();
    const { user } = this.props.auth;
    const name = user.name;
    const amountBet = this.state.InputAmount;
    socket.emit("createGame", { name, amountBet });
  };

  onViewClick = e => {
    e.preventDefault();
    socket.emit("viewLobby");
  };

  onRollClick = e => {
    e.preventDefault();
    $(".dice").css("display", "block");
    $("#rollButton").css("display", "none");
    let senderId = this.state.userid;
    let destiny = this.state.rolledNumber;
    setTimeout(this.showRoll, 5000, senderId, destiny);
    $("#resultLoading").css("display", "block");
  };

  render() {
    return (
      <div style={{ height: "75vh" }} className="container valign-wrapper">
        <div className="row">
          <div className="col s12 ">
            <div className="gameBoard" style={{ display: "none" }}>
              <h1 id="notification" />
              <h3 id="confirmTransaction" style={{ display: "none" }}>
                Waiting for bet to be confirmed with MetaMask...
              </h3>
              <div className="game" style={{ display: "none" }}>
                <div className="dice">
                  <div className="face face-one">
                    <div className="dot" />
                  </div>
                  <div className="face face-two">
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                  <div className="face face-three">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                  <div className="face face-four">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                  <div className="face face-five">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                  <div className="face face-six">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>

                <button
                  id="rollButton"
                  style={{
                    width: "150px",
                    borderRadius: "3px",
                    letterSpacing: "1.5px"
                  }}
                  type="submit"
                  onClick={this.onRollClick}
                  className="btn btn-large waves-effect waves-light hoverable blue accent-3"
                >
                  Roll!
                </button>
                <p id="resultLoading" style={{ display: "none" }}>
                  Rolling dice... Good luck!
                </p>
                <p id="scoreText" style={{ display: "none" }}>
                  You rolled a {this.state.rolledNumber}
                </p>
                <p id="gameWaiting" style={{ display: "none" }}>
                  Waiting for opponent to roll...
                </p>
                <p id="gameResult" style={{ display: "none " }} />
                <div id="linkBack" style={{ display: "none" }}>
                  <Link to="/dashboard" className="btn-flat waves-effect">
                    <i className="material-icons left">keyboard_backspace</i>{" "}
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
            <div className="lobby" style={{ display: "none" }}>
              <table className="center" id="lobbyTable">
                <tbody>
                  <tr>
                    <th>Username</th>
                    <th>Amount Bet (Eth)</th>
                    <th />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="betInput" style={{ display: "none" }}>
              <p id="betText">Enter amount to bet in Ether</p>
              <form noValidate onSubmit={this.onSubmit}>
                <div className="input-field col s12">
                  <input
                    onChange={this.handleInputChange}
                    style={{ width: "40%" }}
                  />
                </div>
                <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                  <button
                    style={{
                      width: "150px",
                      borderRadius: "3px",
                      letterSpacing: "1.5px",
                      marginTop: "1rem"
                    }}
                    type="submit"
                    className="btn btn-large waves-effect waves-light hoverable blue accent-3"
                  >
                    Place Bet
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div
            id="content"
            style={{ textAlign: "center" }}
            className="col s12 "
          >
            <div
              style={{ textAlign: "left", marginTop: "-7%" }}
              className="col s12"
            >
              <Link to="/games" className="btn-flat waves-effect">
                <i className="material-icons left">keyboard_backspace</i> Back
              </Link>
            </div>
            <h4>
              <b>Dice</b>
            </h4>
            <div className="col s12">
              <div style={{ width: "100%" }}>
                <img src={diceLogo} alt="Logo" />
              </div>
              <div className="col s6">
                <button
                  style={{
                    width: "150px",
                    borderRadius: "3px",
                    letterSpacing: "1.5px",
                    marginTop: "1rem"
                  }}
                  onClick={this.onCreateClick}
                  className="btn btn-large waves-effect waves-light hoverable blue accent-3"
                >
                  Create Game
                </button>
              </div>
              <div className="col s6">
                <button
                  style={{
                    width: "150px",
                    borderRadius: "3px",
                    letterSpacing: "1.5px",
                    marginTop: "1rem"
                  }}
                  onClick={this.onViewClick}
                  className="btn btn-large waves-effect waves-light hoverable blue accent-3"
                >
                  View Games
                </button>
              </div>
            </div>
          </div>
          <p id="notification" />
        </div>
      </div>
    );
  }
}

Game.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Game);
