package com.guillerme_backend.app.domain.order;

import com.guillerme_backend.app.domain.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "orders")
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // relación con el usuario autenticado
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.NUEVO;

    // snapshot cliente (para que el admin vea “lo que se usó al comprar”)
    @Column(name = "customer_email", nullable = false, length = 200)
    private String customerEmail;

    @Column(name = "customer_nombre", length = 120)
    private String customerNombre;

    @Column(name = "customer_apellido", length = 120)
    private String customerApellido;

    @Column(name = "customer_telefono", length = 80)
    private String customerTelefono;

    @Column(name = "customer_direccion", columnDefinition = "text")
    private String customerDireccion;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // =========================
    // NUEVO: Envío / seguimiento
    // =========================

    @Column(name = "shipment_tracking", length = 120)
    private String shipmentTracking;

    // guardamos SOLO metadata (igual que imágenes de productos)
    @Column(name = "shipment_file_name", length = 260)
    private String shipmentFileName; // ej: uuid.pdf

    @Column(name = "shipment_file_url", length = 400)
    private String shipmentFileUrl;  // ej: /uploads/uuid.pdf

    // --- getters/setters ---
    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerNombre() { return customerNombre; }
    public void setCustomerNombre(String customerNombre) { this.customerNombre = customerNombre; }

    public String getCustomerApellido() { return customerApellido; }
    public void setCustomerApellido(String customerApellido) { this.customerApellido = customerApellido; }

    public String getCustomerTelefono() { return customerTelefono; }
    public void setCustomerTelefono(String customerTelefono) { this.customerTelefono = customerTelefono; }

    public String getCustomerDireccion() { return customerDireccion; }
    public void setCustomerDireccion(String customerDireccion) { this.customerDireccion = customerDireccion; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    // --- envío ---
    public String getShipmentTracking() { return shipmentTracking; }
    public void setShipmentTracking(String shipmentTracking) { this.shipmentTracking = shipmentTracking; }

    public String getShipmentFileName() { return shipmentFileName; }
    public void setShipmentFileName(String shipmentFileName) { this.shipmentFileName = shipmentFileName; }

    public String getShipmentFileUrl() { return shipmentFileUrl; }
    public void setShipmentFileUrl(String shipmentFileUrl) { this.shipmentFileUrl = shipmentFileUrl; }
}
