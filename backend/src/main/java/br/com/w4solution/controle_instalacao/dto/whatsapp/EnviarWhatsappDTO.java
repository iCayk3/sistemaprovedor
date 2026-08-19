package br.com.w4solution.controle_instalacao.dto.whatsapp;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record EnviarWhatsappDTO(@NotBlank @Size(max = 4000) String texto) {}
