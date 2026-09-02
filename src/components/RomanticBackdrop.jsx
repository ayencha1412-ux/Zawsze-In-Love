export default function RomanticBackdrop({ variant = 'landing' }) {
  return (
    <div className={`romantic-backdrop romantic-backdrop--${variant}`} aria-hidden="true">
      <span className="backdrop-orb orb-a" />
      <span className="backdrop-orb orb-b" />
      <span className="backdrop-orb orb-c" />
      <span className="backdrop-ring ring-a" />
      <span className="backdrop-ring ring-b" />
      <span className="backdrop-script script-a">♡</span>
      <span className="backdrop-script script-b">♡</span>
      <span className="backdrop-spark spark-a">✦</span>
      <span className="backdrop-spark spark-b">✦</span>
      <span className="backdrop-spark spark-c">✦</span>
    </div>
  );
}
