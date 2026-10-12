export default function StatusPage() {
  // TODO (M2): load the signed-in applicant's applications from the API.
  const applications: { id: string; submitted: string; status: string }[] = [];

  return (
    <main className="page">
      <h1>My applications</h1>

      {applications.length === 0 ? (
        <p className="card">You haven't started any applications yet.</p>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.id}</td>
                <td>{application.submitted}</td>
                <td>{application.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
