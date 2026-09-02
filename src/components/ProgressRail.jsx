const steps = [
  { number: 1, label: 'Open', target: 'envelopeChapter' },
  { number: 2, label: 'Understand', target: 'firstTruth' },
  { number: 3, label: 'Clarify', target: 'surpriseChapter' },
  { number: 4, label: 'Show up', target: 'showingUp' },
  { number: 5, label: 'Promise', target: 'promises' },
];

export default function ProgressRail({ activeStep, storyOpen }) {
  const jumpTo = (step) => {
    if (step.number > 1 && !storyOpen) return;
    document.getElementById(step.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="progress" aria-label="Story progress">
      {steps.map((step) => {
        const completed = activeStep >= step.number;
        const active = activeStep === step.number;
        const locked = step.number > 1 && !storyOpen;
        return (
          <button
            key={step.number}
            className={`progress-item ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}
            onClick={() => jumpTo(step)}
            disabled={locked}
            aria-current={active ? 'step' : undefined}
            aria-label={`${step.label}${locked ? ' (locked)' : ''}`}
            title={step.label}
          >
            <span className="progress-heart" aria-hidden="true">{completed ? '♥' : '♡'}</span>
            <span className="progress-label">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
