package com.guillerme_backend.app.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String to, String token) {
        String link = frontendUrl + "/login?token=" + token;

        String html = """
            <div style="margin:0; padding:24px; background:#f3f3f3; font-family:Arial, Helvetica, sans-serif;">
              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px; margin:0 auto; background:#ffffff; border-collapse:collapse;">
                <tr>
                  <td style="background:#f15a2b; color:#ffffff; text-align:center; font-size:28px; font-weight:700; padding:22px 16px;">
                    Gracias por registrarte
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px 28px; color:#222222; font-size:18px; line-height:1.6;">
                    <p style="margin:0 0 18px 0;">
                      Hola,
                    </p>

                    <p style="margin:0 0 18px 0;">
                      <strong>¡Gracias por registrarte en librería Guillerme Guillerme!</strong>
                    </p>

                    <p style="margin:0 0 24px 0;">
                      Para poder empezar a comprar necesitamos que validez tu cuenta haciendo click en el siguiente link:
                    </p>

                    <p style="margin:0 0 28px 0; text-align:center;">
                      <a href="%s"
                         style="display:inline-block; background:#f15a2b; color:#ffffff; text-decoration:none; font-weight:700; font-size:17px; padding:14px 28px; border-radius:8px;">
                        Validar mi cuenta
                      </a>
                    </p>

                    <p style="margin:0 0 14px 0; font-size:15px; color:#555555;">
                      Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                    </p>

                    <p style="margin:0 0 24px 0; word-break:break-all; font-size:14px; color:#f15a2b;">
                      %s
                    </p>

                    <p style="margin:0; font-size:15px; color:#555555;">
                      Si no realizaste este registro, podés ignorar este mensaje.
                    </p>
                  </td>
                </tr>
              </table>
            </div>
            """.formatted(link, link);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Validá tu cuenta - Guillerme");
            helper.setText(html, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("No se pudo enviar el email de verificación", e);
        }
    }
}