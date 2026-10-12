export default function ReferralsPage() {
  // TODO (M4): load referred cases from the API. Underwriters only.
  const referrals: { id: string; applicant: string; score: number }[] = [];

  return (
    <main className="page">
      <h1>Referral queue</h1>

      <p className="notice">
        This page is for underwriters. Access control arrives in milestone M1.
      </p>

      {referrals.length === 0 ? (
        <p className="card">There are no cases waiting for review.</p>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Applicant</th>
              <th>Risk score</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr key={referral.id}>
                <td>{referral.id}</td>
                <td>{referral.applicant}</td>
                <td>{referral.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
