package com.guillerme_backend.app.service;

import com.guillerme_backend.app.domain.order.OrderItemRepository;
import com.guillerme_backend.app.domain.order.OrderRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.util.Locale;

@Service
public class AdminMailService {

    private final JavaMailSender mailSender;
    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;

    @Value("${app.mail.admin-to}")
    private String adminTo;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.contact-channel}")
    private String contactChannel;

    @Value("${app.mail.signature:Guillerme}")
    private String signature;

    @Value("${app.uploads.dir:/uploads}")
    private String uploadsDir;

    public AdminMailService(JavaMailSender mailSender, OrderRepository orderRepo, OrderItemRepository itemRepo) {
        this.mailSender = mailSender;
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
    }

    // ==========================================================
    // ADMIN: Nuevo pedido (HTML mismo formato/grilla)
    // ==========================================================
    public void sendNewOrderEmailToAdmin(Long orderId) {
        var o = orderRepo.findById(orderId).orElseThrow();
        var items = itemRepo.findAllByOrderId(orderId);

        long total = 0L;
        for (var it : items) {
            long unit = (it.getUnitPrice() == null) ? 0L : it.getUnitPrice().longValue();
            int qty = it.getQty();
            total += unit * (long) qty;
        }

        String shippingText = "A coordinar";
        String paymentText = "A coordinar";

        String title = "Nuevo pedido recibido";
        String intro = "Se generó un nuevo pedido. Abajo tenés el detalle completo.";

        String html = buildOrderEmailHtml(
                title,
                intro,
                "Admin",
                orderId,
                o.getCreatedAt() != null ? o.getCreatedAt().toString() : null,
                null,
                items,
                shippingText,
                paymentText,
                total,
                o.getCustomerNombre(),
                o.getCustomerApellido(),
                o.getCustomerDireccion(),
                o.getCustomerTelefono(),
                o.getCustomerEmail(),
                o.getComment()
        );

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setFrom(from);
            helper.setTo(adminTo);
            helper.setSubject("Nuevo pedido #" + orderId + " - " + o.getCustomerEmail());
            helper.setText(html, true);

            mailSender.send(mime);
        } catch (MessagingException e) {
            throw new RuntimeException("No se pudo enviar el mail al admin", e);
        }
    }

    // ==========================================================
    // CLIENTE: Pedido recibido (HTML tipo ticket, sin bancos)
    // ==========================================================
    public void sendOrderConfirmationToCustomer(Long orderId) {
        var o = orderRepo.findById(orderId).orElseThrow();
        var items = itemRepo.findAllByOrderId(orderId);

        long total = 0L;
        for (var it : items) {
            long unit = (it.getUnitPrice() == null) ? 0L : it.getUnitPrice().longValue();
            int qty = it.getQty();
            total += unit * (long) qty;
        }

        String shippingText = "A coordinar";
        String paymentText = "A coordinar";

        String title = "Gracias por tu pedido";
        String intro = "Recibimos tu pedido. En breve nos ponemos en contacto para confirmarlo.";

        String html = buildOrderEmailHtml(
                title,
                intro,
                o.getCustomerNombre(),
                orderId,
                o.getCreatedAt() != null ? o.getCreatedAt().toString() : null,
                null,
                items,
                shippingText,
                paymentText,
                total,
                o.getCustomerNombre(),
                o.getCustomerApellido(),
                o.getCustomerDireccion(),
                o.getCustomerTelefono(),
                o.getCustomerEmail(),
                o.getComment()
        );

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setFrom(from);
            helper.setTo(o.getCustomerEmail());
            helper.setSubject("Pedido recibido #" + orderId + " - " + signature);
            helper.setText(html, true);

            mailSender.send(mime);
        } catch (MessagingException e) {
            throw new RuntimeException("No se pudo enviar el mail de confirmación", e);
        }
    }

    // ==========================================================
    // CLIENTE: Pedido enviado (HTML + tracking + adjunto)
    // ==========================================================
    public void sendOrderShippedToCustomer(Long orderId) {
        var o = orderRepo.findById(orderId).orElseThrow();
        var items = itemRepo.findAllByOrderId(orderId);

        String tracking = (o.getShipmentTracking() == null) ? "" : o.getShipmentTracking().trim();
        String fileName = (o.getShipmentFileName() == null) ? "" : o.getShipmentFileName().trim();

        long total = 0L;
        for (var it : items) {
            long unit = (it.getUnitPrice() == null) ? 0L : it.getUnitPrice().longValue();
            int qty = it.getQty();
            total += unit * (long) qty;
        }

        String shippingText = "Envío gestionado";
        String paymentText = "Transferencia"; // ✅ CAMBIO ACÁ

        String title = "¡Tu pedido fue enviado! 🚚";
        String intro = "Tu pedido ya está en camino. Abajo te dejamos el detalle. "
                + "Adjuntamos el comprobante/etiqueta para que puedas rastrear su estado.";

        String html = buildOrderEmailHtml(
                title,
                intro,
                o.getCustomerNombre(),
                orderId,
                o.getCreatedAt() != null ? o.getCreatedAt().toString() : null,
                tracking.isBlank() ? null : tracking,
                items,
                shippingText,
                paymentText,
                total,
                o.getCustomerNombre(),
                o.getCustomerApellido(),
                o.getCustomerDireccion(),
                o.getCustomerTelefono(),
                o.getCustomerEmail(),
                o.getComment()
        );

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(o.getCustomerEmail());
            helper.setSubject("Pedido enviado #" + orderId + " - " + signature);
            helper.setText(html, true);

            if (!fileName.isBlank()) {
                Path base = Paths.get(uploadsDir).toAbsolutePath().normalize();
                Path filePath = base.resolve(fileName).normalize();

                if (!filePath.startsWith(base)) {
                    throw new IllegalArgumentException("Ruta de adjunto inválida");
                }

                FileSystemResource res = new FileSystemResource(filePath.toFile());
                if (res.exists() && res.isReadable()) {
                    helper.addAttachment(fileName, res);
                }
            }

            mailSender.send(mime);
        } catch (MessagingException e) {
            throw new RuntimeException("No se pudo enviar el mail de envío", e);
        }
    }

    // ==========================================================
    // HTML builder (layout tipo imagen, SIN datos bancarios, SIN subtotal)
    // ==========================================================
    private String buildOrderEmailHtml(
            String headerTitle,
            String introText,
            String customerName,
            Long orderId,
            String orderDateIso,
            String tracking,
            Iterable<?> items,
            String shippingText,
            String paymentText,
            long total,
            String nombre,
            String apellido,
            String direccion,
            String telefono,
            String email,
            String comment
    ) {
        var currency = NumberFormat.getCurrencyInstance(new Locale("es", "AR"));

        String safeName = esc(customerName);
        String safeSignature = esc(signature);
        String safeChannel = esc(contactChannel);

        String safeNombre = esc(nombre);
        String safeApellido = esc(apellido);
        String safeDireccion = esc(direccion);
        String safeTelefono = esc(telefono);
        String safeEmail = esc(email);

        String safeIntro = esc(introText);

        StringBuilder rows = new StringBuilder();
        for (Object obj : items) {
            try {
                String prod = String.valueOf(obj.getClass().getMethod("getProductNombre").invoke(obj));
                Object qtyObj = obj.getClass().getMethod("getQty").invoke(obj);
                Object unitObj = obj.getClass().getMethod("getUnitPrice").invoke(obj);

                int qty = (qtyObj == null) ? 0 : (Integer) qtyObj;
                long unit = (unitObj == null) ? 0L : ((Number) unitObj).longValue();

                rows.append("<tr>")
                        .append("<td style=\"padding:10px;border:1px solid #e6e6e6;\">").append(esc(prod)).append("</td>")
                        .append("<td style=\"padding:10px;border:1px solid #e6e6e6;text-align:center;\">").append(qty).append("</td>")
                        .append("<td style=\"padding:10px;border:1px solid #e6e6e6;text-align:right;\">").append(esc(currency.format(unit))).append("</td>")
                        .append("</tr>");
            } catch (Exception ignore) { }
        }

        String trackingBlock = "";
        if (tracking != null && !tracking.isBlank()) {
            trackingBlock =
                    "<p style=\"margin:12px 0 0;font-size:13px;line-height:1.5;\">" +
                            "<b>Código de seguimiento:</b> " + esc(tracking) +
                            "</p>";
        }

        String commentBlock = "";
        if (comment != null && !comment.isBlank()) {
            commentBlock =
                    "<tr>" +
                            "<td style=\"padding:10px;border:1px solid #e6e6e6;\"><b>Nota:</b></td>" +
                            "<td style=\"padding:10px;border:1px solid #e6e6e6;\" colspan=\"2\">" + esc(comment) + "</td>" +
                            "</tr>";
        }

        return ""
                + "<!doctype html>"
                + "<html><head><meta charset=\"UTF-8\" />"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
                + "</head>"
                + "<body style=\"margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;\">"

                + "<div style=\"max-width:620px;margin:0 auto;padding:24px 12px;\">"
                + "<div style=\"max-width:360px;margin:0 auto;background:#fff;border:1px solid #e6e6e6;\">"

                + "<div style=\"background:#EA5534;color:#fff;padding:14px 16px;text-align:center;font-weight:700;font-size:14px;\">"
                + esc(headerTitle)
                + "</div>"

                + "<div style=\"padding:18px 16px;\">"

                + "<p style=\"margin:0 0 10px;font-size:13px;line-height:1.5;\">Hola " + safeName + ",</p>"
                + "<p style=\"margin:0 0 10px;font-size:13px;line-height:1.5;\">" + safeIntro + "</p>"

                + "<div style=\"margin:10px 0 0;font-size:12px;color:#555;\">"
                + "<b>Pedido #" + orderId + "</b>"
                + (orderDateIso != null ? " · " + esc(orderDateIso) : "")
                + "</div>"

                + trackingBlock

                + "<div style=\"margin:14px 0 0;\">"
                + "<table style=\"width:100%;border-collapse:collapse;font-size:12px;\">"
                + "<thead>"
                + "<tr>"
                + "<th style=\"padding:10px;border:1px solid #e6e6e6;text-align:left;background:#fafafa;\">Producto</th>"
                + "<th style=\"padding:10px;border:1px solid #e6e6e6;text-align:center;background:#fafafa;\">Cantidad</th>"
                + "<th style=\"padding:10px;border:1px solid #e6e6e6;text-align:right;background:#fafafa;\">Precio</th>"
                + "</tr>"
                + "</thead>"
                + "<tbody>"
                + rows
                + "</tbody>"
                + "</table>"
                + "</div>"

                + "<div style=\"margin:12px 0 0;\">"
                + "<table style=\"width:100%;border-collapse:collapse;font-size:12px;\">"
                + "<tr>"
                + "<td style=\"padding:10px;border:1px solid #e6e6e6;\"><b>Envío:</b></td>"
                + "<td style=\"padding:10px;border:1px solid #e6e6e6;\" colspan=\"2\">" + esc(shippingText) + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td style=\"padding:10px;border:1px solid #e6e6e6;\"><b>Método de pago:</b></td>"
                + "<td style=\"padding:10px;border:1px solid #e6e6e6;\" colspan=\"2\">" + esc(paymentText) + "</td>"
                + "</tr>"
                + "<tr>"
                + "<td style=\"padding:10px;border:1px solid #e6e6e6;\"><b>Total:</b></td>"
                + "<td style=\"padding:10px;border:1px solid #e6e6e6;text-align:right;\" colspan=\"2\"><b>" + esc(currency.format(total)) + "</b></td>"
                + "</tr>"
                + commentBlock
                + "</table>"
                + "</div>"

                + "<p style=\"margin:14px 0 0;font-size:12px;line-height:1.5;color:#444;\">"
                + "<b>¿Dudas?</b> Escribinos por: " + safeChannel
                + "</p>"

                + "<div style=\"margin:14px 0 0;font-size:12px;color:#333;\">"
                + "<div style=\"color:#EA5534;font-weight:700;margin-bottom:6px;\">Dirección de facturación</div>"
                + "<div style=\"border:1px solid #e6e6e6;padding:10px;line-height:1.45;\">"
                + safeNombre + " " + safeApellido + "<br/>"
                + (safeDireccion.isBlank() ? "" : safeDireccion + "<br/>")
                + (safeTelefono.isBlank() ? "" : safeTelefono + "<br/>")
                + safeEmail
                + "</div>"
                + "</div>"

                + "<p style=\"margin:14px 0 0;font-size:12px;color:#666;\">" + safeSignature + "</p>"

                + "</div></div></div>"
                + "</body></html>";
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
