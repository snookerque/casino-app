import React, { Component } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import cardLogo from "../../images/cards.png";
import diceLogo from "../../images/dice.png";
class SelectGame extends Component {
  onDiceClick = e => {
    e.preventDefault();
    this.props.history.push("/dice");
  };

  render() {
    return (
      <div style={{ height: "75vh" }} className="container valign-wrapper">
        <div className="row">
          <div style={{ textAlign: "center" }} className="col s12 ">
            <div
              style={{ textAlign: "left", marginTop: "-7%" }}
              className="col s12"
            >
              <Link to="/dashboard" className="btn-flat waves-effect">
                <i className="material-icons left">keyboard_backspace</i> Back
              </Link>
            </div>
            <h4>
              <b>Please Select a Game!</b>
            </h4>
            <div className="col s6">
              <div style={{ width: "100%" }}>
                <img src={diceLogo} alt="Logo" />
              </div>
              <button
                style={{
                  width: "150px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px",
                  marginTop: "1rem"
                }}
                onClick={this.onDiceClick}
                className="btn btn-large waves-effect waves-light hoverable blue accent-3"
              >
                Dice
              </button>
            </div>
            <div className="col s6">
              <div style={{ width: "100%" }}>
                <img src={cardLogo} alt="Logo" />
              </div>
              <button
                style={{
                  width: "150px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px",
                  marginTop: "1rem"
                }}
                className="btn btn-large waves-effect waves-light hoverable blue accent-3"
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect()(SelectGame);
