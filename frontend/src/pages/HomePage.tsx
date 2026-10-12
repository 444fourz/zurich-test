import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="page">
      <h1>Health insurance, assessed online</h1>
      <p>
        Complete a short health questionnaire and receive a decision quickly.
        Some applications are passed to an underwriter for a closer look.
      </p>

      <div className="card">
        <h2>How it works</h2>
        <ol>
          <li>Create an account.</li>
          <li>Answer the health questionnaire.</li>
          <li>Receive an outcome, or a referral to an underwriter.</li>
        </ol>
        <Link className="button" to="/apply">
          Start an application
        </Link>
      </div>

      <p>
        Already registered? <Link to="/login">Log in</Link>.
      </p>
    </main>
  );
}
