import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold">Acesse sua conta</h1>
        <p className="text-muted-foreground">O login será implementado na próxima etapa.</p>
        
        <div className="pt-8">
          <Link 
            to="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
