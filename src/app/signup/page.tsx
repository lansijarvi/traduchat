import { AuthForm } from '@/components/auth-form';
import { Globe } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
            <Globe className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create an account</h1>
          <p className="mt-2 text-muted-foreground">Start your translated conversations.</p>
        </div>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
