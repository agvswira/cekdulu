interface UnavailableStateProps {
  message: string;
  safetySteps: readonly string[];
  onRetry: () => void;
  onReset?: () => void;
}

export function UnavailableState({ message, safetySteps, onRetry, onReset }: UnavailableStateProps) {
  return (
    <section className="unavailableState" aria-labelledby="unavailable-heading">
      <p className="sectionKicker">Panduan aman sementara</p>
      <h2 data-stage-heading id="unavailable-heading" tabIndex={-1}>
        Analisis belum tersedia
      </h2>
      <p>{message}</p>
      <ul className="safetyStepList">
        {safetySteps.map((step) => <li key={step}>{step}</li>)}
      </ul>
      <div className="stateActions">
        <button className="primaryButton" type="button" onClick={onRetry}>
          Coba lagi
        </button>
        {onReset ? (
          <button className="secondaryButton" type="button" onClick={onReset}>
            Periksa pesan lain
          </button>
        ) : null}
      </div>
    </section>
  );
}
