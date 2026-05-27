package com.vg.auth.service.impl;

import com.vg.auth.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
// DDD: Infrastructure adapter — envío de correos usando JavaMail.
//
// Implementa el puerto EmailService definido en la capa de dominio.
// Utiliza JavaMailSender de Spring para el envío real de emails.
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Override
    public Mono<Void> sendPasswordResetEmail(String to, String name, String resetUrl) {
        return Mono.fromRunnable(() -> sendPasswordReset(to, name, resetUrl))
                .subscribeOn(Schedulers.boundedElastic())
                .then();
    }

    private void sendPasswordReset(String to, String name, String resetUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject("Recupera tu acceso a EduNova");
            helper.setText(buildPasswordResetHtml(name, resetUrl), true);

            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("No se pudo preparar el correo de recuperacion", ex);
        }
    }

    private String buildPasswordResetHtml(String name, String resetUrl) {
        String displayName = name == null || name.isBlank() ? "usuario" : escapeHtml(name);
        String safeUrl = escapeHtml(resetUrl);

        return """
                <!doctype html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Recupera tu acceso</title>
                </head>
                <body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6ebf3;">
                          <tr>
                            <td style="background:#0b1b49;color:#ffffff;padding:28px 32px;text-align:center;">
                              <div style="font-size:22px;font-weight:800;">EduNova</div>
                              <div style="font-size:13px;color:#a9b8df;margin-top:6px;">Recuperacion de acceso</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:32px;">
                              <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Hola, %s</h1>
                              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                                Recibimos una solicitud para restablecer tu contrasena. Usa el siguiente enlace para crear una nueva contrasena.
                              </p>
                              <p style="margin:28px 0;text-align:center;">
                                <a href="%s" style="display:inline-block;background:#165ef0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;">
                                  Restablecer contrasena
                                </a>
                              </p>
                              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#6b7280;">
                                Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(displayName, safeUrl);
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
