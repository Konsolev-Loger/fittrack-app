// Keep the email flows available for a later SMTP rollout, disabled by default.
export const emailAuthEnabled = () => process.env.EMAIL_AUTH_ENABLED === "true";
