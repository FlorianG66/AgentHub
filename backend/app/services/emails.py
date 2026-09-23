import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_password_reset_email(email: str, full_name: str, reset_url: str) -> None:
    """Envoie l'e-mail de réinitialisation de mot de passe.

    - ``EMAIL_BACKEND=console`` : aucune envoi réel, le jeton/URL est simplement loggé
      et renvoyé par l'API (mode démo/dev).
    - ``EMAIL_BACKEND=smtp`` : envoi réel via SMTP (SMTP_HOST/SMTP_PORT/...).
    """
    if settings.EMAIL_BACKEND != "smtp":
        print(f"[email|console] Réinitialisation pour {email} -> {reset_url}")
        return

    msg = EmailMessage()
    msg["Subject"] = "SynergyAI — Réinitialisation de votre mot de passe"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    msg.set_content(
        f"Bonjour {full_name},\n\n"
        f"Vous avez demandé la réinitialisation de votre mot de passe.\n"
        f"Cliquez sur le lien suivant (valable {settings.PASSWORD_RESET_EXPIRE_MINUTES} min) :\n\n"
        f"{reset_url}\n\n"
        f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n"
        f"— L'équipe SynergyAI"
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)


def send_invitation_email(email: str, full_name: str, temporary_password: str) -> None:
    """Envoie un e-mail d'invitation avec le mot de passe temporaire."""
    if settings.EMAIL_BACKEND != "smtp":
        print(
            f"[email|console] Invitation pour {email} ({full_name}) "
            f"-> mot de passe temporaire : {temporary_password}"
        )
        return

    msg = EmailMessage()
    msg["Subject"] = "SynergyAI — Votre accès à l'espace d'équipe"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    msg.set_content(
        f"Bonjour {full_name},\n\n"
        f"Votre responsable vous a invité sur la plateforme SynergyAI.\n\n"
        f"Accès : {settings.FRONTEND_URL}/login\n"
        f"E-mail : {email}\n"
        f"Mot de passe temporaire : {temporary_password}\n\n"
        f"Nous vous recommandons de le changer après votre première connexion.\n"
        f"— L'équipe SynergyAI"
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)