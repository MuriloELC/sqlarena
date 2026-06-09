export function getFriendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("email rate limit exceeded") ||
    normalized.includes("rate limit") && normalized.includes("email")
  ) {
    return "Limite de envio de email atingido no Supabase. Aguarde alguns minutos ou, em desenvolvimento, desative Auth > Providers > Email > Confirm email no painel do Supabase.";
  }

  if (normalized.includes("unsupported provider") || normalized.includes("provider is not enabled")) {
    return "Este provedor social ainda nao esta habilitado no Supabase. Ative Google/GitHub em Authentication > Providers.";
  }

  if (normalized.includes("invalid") && normalized.includes("email")) {
    return "Email invalido. Use um endereco de email real para o cadastro.";
  }

  if (normalized.includes("already registered") || normalized.includes("user already registered")) {
    return "Este email ja esta cadastrado. Tente entrar pela tela de login.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Email ou senha incorretos.";
  }

  return message || "Nao foi possivel concluir a autenticacao.";
}
