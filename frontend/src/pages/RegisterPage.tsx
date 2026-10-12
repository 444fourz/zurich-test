import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO (M1): call the backend registration endpoint.
    setSubmitted(true);
  }

  return (
    <main className="page">
      <h1>Create an account</h1>

      <form className="stack card" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

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
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="button" type="submit">
          Register
        </button>
      </form>

      {submitted && (
        <p className="notice">
          Registration isn't connected yet. It arrives in milestone M1.
        </p>
      )}

      <p>
        Already registered? <Link to="/login">Log in</Link>.
      </p>
    </main>
  );
}
