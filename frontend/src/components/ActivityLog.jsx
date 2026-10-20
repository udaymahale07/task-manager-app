// Mirrors the backend's request-logging middleware: every action taken in the
// UI is echoed here the way Express logs `METHOD /url - timestamp` to the console.
export default function ActivityLog({ entries }) {
  return (
    <div className="activity-log">
      <div className="activity-log__bar">
        <span className="activity-log__dots">
          <span />
          <span />
          <span />
        </span>
        <span className="activity-log__label">server activity</span>
      </div>
      <div className="activity-log__body">
        {entries.length === 0 && (
          <div className="activity-log__line activity-log__line--muted">
            waiting for requests…
          </div>
        )}
        {entries.map((entry, i) => (
          <div className="activity-log__line" key={i}>
            <span className={`activity-log__method activity-log__method--${entry.method.toLowerCase()}`}>
              {entry.method}
            </span>
            <span className="activity-log__url">{entry.url}</span>
            <span className="activity-log__time">{entry.time}</span>
          </div>
        ))}
        <div className="activity-log__cursor">
          <span>$</span>
          <span className="activity-log__blink">_</span>
        </div>
      </div>
    </div>
  );
}
