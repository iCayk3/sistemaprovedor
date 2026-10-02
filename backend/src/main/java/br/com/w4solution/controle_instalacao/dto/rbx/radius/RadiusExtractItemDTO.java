package br.com.w4solution.controle_instalacao.dto.rbx.radius;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RadiusExtractItemDTO(
        @JsonProperty("customer_id") String customerId,
        @JsonProperty("username") String username,
        @JsonProperty("start_time") String startTime,
        @JsonProperty("stop_time") String stopTime,
        @JsonProperty("session_time") String sessionTime,
        @JsonProperty("octets_input") String octetsInput,
        @JsonProperty("octets_output") String octetsOutput,
        @JsonProperty("nas") String nas,
        @JsonProperty("ipaddress") String ipAddress,
        @JsonProperty("ipv6address") String ipv6Address,
        @JsonProperty("delegatedipv6prefix") String delegatedIpv6Prefix,
        @JsonProperty("mac") String mac,
        @JsonProperty("terminatecause") String terminateCause
) {}
