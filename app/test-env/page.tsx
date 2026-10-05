export default function TestEnv() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Environment Test</h1>
      <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'NOT SET'}</p>
      <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
    </div>
  )
}
