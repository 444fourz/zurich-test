import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>We couldn't find the page you were looking for.</p>
      <Link to="/">Back to the home page</Link>
    </main>
  );
}
