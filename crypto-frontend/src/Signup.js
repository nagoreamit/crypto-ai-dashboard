import { useState } from "react";

const BASE_URL = process.env.REACT_APP_API_URL;

function Signup({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup Successful 🎉");
        switchToLogin();
      } else {
        alert(data.detail);
      }

    } catch (err) {
      alert("Server error");
      console.error(err);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "120px" }}>
      <h2>📝 Signup</h2>

      <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} /><br /><br />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br /><br />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br /><br />

      <button onClick={handleSignup}>Signup</button>

      <p onClick={switchToLogin} style={{ cursor: "pointer" }}>
        Already have account? Login
      </p>
    </div>
  );
}

export default Signup;