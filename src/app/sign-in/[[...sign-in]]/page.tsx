import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="term-center">
      <div>
        <p className="term-label" style={{ textAlign: 'center' }}>
          Acceso clasificado · Payments
        </p>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#39ff14',
              colorBackground: '#111111',
              colorText: '#e8e8e8',
              colorInputBackground: '#0a0a0a',
              colorInputText: '#e8e8e8',
              borderRadius: '0px',
              fontFamily: 'var(--font-mono), monospace',
            },
          }}
        />
      </div>
    </div>
  );
}
