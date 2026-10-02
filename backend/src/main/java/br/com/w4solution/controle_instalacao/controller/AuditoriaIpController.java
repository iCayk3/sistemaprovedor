package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.dto.rbx.radius.ConsultaAuditoriaIpDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.radius.RespostaAuditoriaIpDTO;
import br.com.w4solution.controle_instalacao.services.rbx.AuditoriaIpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.TECHNICAL_ACCESS;

@RestController
@RequestMapping("auditoria-ip")
@PreAuthorize(TECHNICAL_ACCESS)
public class AuditoriaIpController {

    private final AuditoriaIpService service;

    public AuditoriaIpController(AuditoriaIpService service) {
        this.service = service;
    }

    @PostMapping("/consultar")
    public ResponseEntity<RespostaAuditoriaIpDTO> consultar(@RequestBody @Valid ConsultaAuditoriaIpDTO dto) throws Exception {
        return ResponseEntity.ok(service.auditarIp(dto));
    }
}
