import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO (M1): call the backend login endpoint and store the session.
    setSubmitted(true);
  }

  return (
    <main className="page">
      <h1>Log in</h1>

      <form className="stack card" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="button" type="submit">
          Log in
        </button>
      </form>

      {submitted && (
        <p className="notice">
          Authentication isn't connected yet. It arrives in milestone M1.
        </p>
      )}

      <p>
        New here? <Link to="/register">Create an account</Link>.
      </p>
    </main>
  );
}
