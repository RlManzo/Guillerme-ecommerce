package com.guillerme_backend.app.service;

import com.guillerme_backend.app.domain.order.OrderItemRepository;
import com.guillerme_backend.app.domain.order.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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

    @Value("${app.mail.signature:LKS Style}")
    private String signature;

    public AdminMailService(JavaMailSender mailSender, OrderRepository orderRepo, OrderItemRepository itemRepo) {
        this.mailSender = mailSender;
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
    }

    public void sendNewOrderEmailToAdmin(Long orderId) {
        var o = orderRepo.findById(orderId).orElseThrow();
        var items = itemRepo.findAllByOrderId(orderId);

        StringBuilder sb = new StringBuilder();
        sb.append("Nuevo pedido #").append(orderId).append("\n\n");
        sb.append("Cliente:\n");
        sb.append(o.getCustomerNombre()).append(" ").append(o.getCustomerApellido()).append("\n");
        sb.append("Email: ").append(o.getCustomerEmail()).append("\n");
        sb.append("Tel: ").append(o.getCustomerTelefono()).append("\n");
        sb.append("Dirección: ").append(o.getCustomerDireccion()).append("\n\n");

        sb.append("Items:\n");
        for (var it : items) {
            sb.append("- ").append(it.getProductNombre())
                    .append(" x ").append(it.getQty()).append("\n");
        }

        if (o.getComment() != null && !o.getComment().isBlank()) {
            sb.append("\nComentario:\n").append(o.getComment()).append("\n");
        }

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(adminTo);
        msg.setSubject("Nuevo pedido #" + orderId + " - " + o.getCustomerEmail());
        msg.setText(sb.toString());

        mailSender.send(msg);
    }

    public void sendOrderConfirmationToCustomer(Long orderId) {
        var o = orderRepo.findById(orderId).orElseThrow();
        var items = itemRepo.findAllByOrderId(orderId);

        StringBuilder sb = new StringBuilder();
        sb.append("¡Recibimos tu pedido! ✅").append("\n\n");
        sb.append("Número de pedido: #").append(orderId).append("\n\n");

        sb.append("Resumen:\n");
        for (var it : items) {
            sb.append("- ").append(it.getProductNombre())
                    .append(" x ").append(it.getQty()).append("\n");
        }

        if (o.getComment() != null && !o.getComment().isBlank()) {
            sb.append("\nTu comentario:\n").append(o.getComment()).append("\n");
        }

        sb.append("\nDatos de contacto registrados:\n");
        sb.append(o.getCustomerNombre()).append(" ").append(o.getCustomerApellido()).append("\n");
        sb.append("Email: ").append(o.getCustomerEmail()).append("\n");
        sb.append("Tel: ").append(o.getCustomerTelefono()).append("\n");
        sb.append("Dirección: ").append(o.getCustomerDireccion()).append("\n");

        sb.append("\n¿Cómo sigue?\n");
        sb.append("Nos vamos a comunicar para confirmar stock, tiempos y forma de entrega.\n");
        sb.append("Si querés escribirnos vos, este es el canal:\n");
        sb.append(contactChannel).append("\n\n");

        sb.append(signature).append("\n");

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(o.getCustomerEmail());
        msg.setSubject("Pedido recibido #" + orderId + " - " + signature);
        msg.setText(sb.toString());

        mailSender.send(msg);
    }
}
