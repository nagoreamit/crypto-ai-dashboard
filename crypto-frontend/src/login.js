import { useState } from "react";
import "./Auth.css";

const BASE_URL = process.env.REACT_APP_API_URL;

function Login({ setIsLoggedIn, switchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login Successful 🚀");
        localStorage.setItem("isLoggedIn", "true");
        setIsLoggedIn(true);
      } else {
        alert(data.detail);
      }

    } catch (err) {
      alert("Server error");
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2 className="neon-title">⚡ Crypto Login</h2>

        <input
          type="email"
          placeholder="Enter Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>LOGIN</button>

        <p onClick={switchToSignup} style={{ cursor: "pointer" }}>
          Don't have account? Signup
        </p>

      </div>
    </div>
  );
}

export default Login;