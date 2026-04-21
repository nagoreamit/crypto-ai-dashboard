import { useState } from "react";
import "./Bot.css";

function Bot() {
  const [messages, setMessages] = useState([
    { type: "bot", text: "🤖 Hello! I can help you with crypto decisions." }
  ]);
  const [input, setInput] = useState("");

  // 🔥 PREDEFINED QUESTIONS
  const suggestions = [
    "Should I buy Bitcoin?",
    "Market trend?",
    "Should I sell now?",
    "Is Ethereum good?"
  ];

  const sendMessage = (msg = input) => {
    if (!msg.trim()) return;

    const userMsg = { type: "user", text: msg };

    let botReply = "🤖 Analyzing market...";

    const lower = msg.toLowerCase();

    if (lower.includes("buy")) {
      botReply = "📈 Buying depends on signal + sentiment. Check dashboard.";
    } else if (lower.includes("sell")) {
      botReply = "📉 If signal is SELL, better to exit or wait.";
    } else if (lower.includes("bitcoin")) {
      botReply = "₿ Bitcoin is volatile, watch prediction & sentiment.";
    } else if (lower.includes("trend")) {
      botReply = "📊 Market trend depends on price + news sentiment.";
    }

    const botMsg = { type: "bot", text: botReply };

    setMessages([...messages, userMsg, botMsg]);
    setInput("");
  };

  return (
    <div className="bot-container">

      <div className="bot-header">
        🤖 AI CRYPTO ASSISTANT
      </div>

      {/* 💬 CHAT */}
      <div className="bot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.type === "bot" ? "bot-msg" : "user-msg"}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* 🔥 SUGGESTIONS */}
      <div className="bot-suggestions">
        {suggestions.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q)}>
            {q}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div className="bot-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask like: Should I buy Bitcoin?"
        />
        <button onClick={() => sendMessage()}>➤</button>
      </div>

    </div>
  );
}

export default Bot;