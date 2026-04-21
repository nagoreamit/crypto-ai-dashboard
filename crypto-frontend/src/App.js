import Login from "./login";
import Signup from "./Signup";
import { useEffect, useState } from "react";
import "./App.css";
import PredictionChart from "./PredictionChart";
import Bot from "./Bot";
import News from "./News";

function App() {
  const [data, setData] = useState(null);
  const [crypto, setCrypto] = useState("bitcoin");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [showGraph, setShowGraph] = useState(false);

  // 🔐 AUTH
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );
  const [showSignup, setShowSignup] = useState(false);

  const cryptoNames = {
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    litecoin: "Litecoin"
  };

  const cryptoLogos = {
    bitcoin: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    ethereum: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    litecoin: "https://cryptologos.cc/logos/litecoin-ltc-logo.png"
  };

  const BASE_URL = process.env.REACT_APP_API_URL;

const fetchData = async () => {
  try {
    const res = await fetch(
      `${BASE_URL}/predict?crypto=${crypto}`
    );
    const json = await res.json();
    setData(json);
  } catch (err) {
    console.error("Fetch error:", err);
  }
};

  const openDetail = () => {
    if (!data) return;
    setModalData(data);
    setShowModal(true);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [crypto, isLoggedIn]);

  // 🔐 AUTH UI
  if (!isLoggedIn) {
    return showSignup ? (
      <Signup switchToLogin={() => setShowSignup(false)} />
    ) : (
      <Login
        setIsLoggedIn={setIsLoggedIn}
        switchToSignup={() => setShowSignup(true)}
      />
    );
  }

  // ---------------- DASHBOARD ----------------
  return (
    <div className="main">
      <div className="glass-card">
        <div className="ui-header">
          <div className="left">
            <div className="user-icon"></div>
            <span>Crypto AI Dashboard 🚀</span>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("isLoggedIn");
              setIsLoggedIn(false);
            }}
            style={{
              background: "#ff4757",
              border: "none",
              padding: "6px 12px",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>

        <select
          className="dropdown"
          onChange={(e) => setCrypto(e.target.value)}
          value={crypto}
        >
          <option value="bitcoin">Bitcoin</option>
          <option value="ethereum">Ethereum</option>
          <option value="litecoin">Litecoin</option>
        </select>

        {!data ? (
          <div className="loader">Loading Neural Link...</div>
        ) : (
          <div className="grid">
            <div className="neo-box" onClick={openDetail}>
              <p>💰 {cryptoNames[crypto]} Price</p>
              <h3>USD {data.live_price?.toLocaleString()}</h3>
              <div className="live-tag">CLICK FOR ANALYSIS</div>
            </div>

            <div
              className="neo-box prediction-box"
              onClick={() => setShowGraph(true)}
            >
              <p>🤖 Final Prediction</p>
              <h3>{Number(data.predicted_price).toFixed(2)}</h3>
              <div className="live-tag">HYBRID MODEL</div>
            </div>

            <div className="neo-box">
              <p>🧠 LSTM Model</p>
              <h3>
                {data.lstm_price
                  ? Number(data.lstm_price).toFixed(2)
                  : "N/A"}
              </h3>
            </div>

            <div className="neo-box">
              <p>⚡ Linear Regression</p>
              <h3>
                {data.lr_price
                  ? Number(data.lr_price).toFixed(2)
                  : "N/A"}
              </h3>
            </div>

            <div className="neo-box">
              <p>📊 Signal</p>
              <h3
                style={{
                  color: data.signal.includes("BUY")
                    ? "#2ed573"
                    : "#ff4757"
                }}
              >
                {data.signal}
              </h3>
            </div>

            <div className="neo-box">
              <p>🧠 Sentiment</p>
              <h3>{data.sentiment}</h3>
            </div>
          </div>
        )}

        {data && (
          <div className="bot-advice" style={{ marginTop: "20px" }}>
            🤖 {data.bot_message}
          </div>
        )}
      </div>

      {showModal && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="btc-terminal"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="close-modal"
              onClick={() => setShowModal(false)}
            >
              &times;
            </span>

            <h2 style={{ textAlign: "center" }}>
              {cryptoNames[crypto]} Analysis
            </h2>

            <p>Price: {modalData.live_price}</p>
            <p>Prediction: {modalData.predicted_price}</p>
          </div>
        </div>
      )}

      {showGraph && data && (
        <div className="modal-overlay" onClick={() => setShowGraph(false)}>
          <div
            className="btc-terminal"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="close-modal"
              onClick={() => setShowGraph(false)}
            >
              &times;
            </span>

            <PredictionChart
              live={data.live_price}
              predicted={data.predicted_price}
            />
          </div>
        </div>
      )}

      <Bot />
      <News />
    </div>
  );
}

export default App;