interface UnavailableStateProps {
  message: string;
  safetySteps: readonly string[];
  onRetry: () => void;
}

export function UnavailableState({ message, safetySteps, onRetry }: UnavailableStateProps) {
  return (
    <section className="unavailableState" aria-labelledby="unavailable-heading">
      <p className="sectionKicker">Panduan aman sementara</p>
      <h2 id="unavailable-heading">Analisis belum tersedia</h2>
      <p>{message}</p>
      <ul className="safetyStepList">
        {safetySteps.map((step) => <li key={step}>{step}</li>)}
      </ul>
      <button className="secondaryButton" type="button" onClick={onRetry}>
        Coba lagi
      </button>
    </section>
  );
}
