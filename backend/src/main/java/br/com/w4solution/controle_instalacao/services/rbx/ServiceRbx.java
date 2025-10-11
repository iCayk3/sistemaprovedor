package br.com.w4solution.controle_instalacao.services.rbx;

import br.com.w4solution.controle_instalacao.dto.ValorBaixadoDTO;
import br.com.w4solution.controle_instalacao.dto.cliente.BoletosBaixadosRbxDTO;
import br.com.w4solution.controle_instalacao.dto.cliente.ClienteRbxDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.*;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ServiceRbx {

    @Autowired
    private IntegracaoRbx integracaoRbx;
    @Value("${api.service.integration.rbx.chave}")
    private String chaveApi;

    public List<ResponsePieReact> boletosBaixadosPorCidade(LocalDate data) {
        LocalDate dataFiltro = (data != null) ? data : LocalDate.now();

        String boletosBaixadosDia = """
                    {
                       "ConsultaDocumentosBaixados": {
                          "Autenticacao": {
                             "ChaveIntegracao": "%s"
                          },
                          "Filtro": "Movimento.DataBaixa = '%s'"
                       }
                    }
                """.formatted(chaveApi, dataFiltro);

        try {
            List<ClienteRbxDTO> clientes = buscarClientesRbx(null);

            List<BoletosBaixadosRbxDTO> boletos = integracaoRbx.fazerRequest(
                    boletosBaixadosDia,
                    new TypeReference<RespostaAPI<BoletosBaixadosRbxDTO>>() {
                    }
            );

            // Map para garantir 1 boleto por pessoa (codigoPessoa -> boleto)
            Map<String, BoletosBaixadosRbxDTO> boletoUnicoPorPessoa = new HashMap<>();
            for (BoletosBaixadosRbxDTO boleto : boletos) {
                boletoUnicoPorPessoa.putIfAbsent(boleto.codigoPessoa(), boleto);
            }

            // Mapeia os totais por grupo usando os boletos únicos
            Map<String, Double> totaisPorGrupo = new HashMap<>();
            for (BoletosBaixadosRbxDTO boleto : boletoUnicoPorPessoa.values()) {
                for (ClienteRbxDTO cliente : clientes) {
                    if (Objects.equals(boleto.codigoPessoa(), cliente.codigo())) {
                        String grupo = cliente.grupo();
                        double valor = Double.parseDouble(boleto.valorBaixado());
                        totaisPorGrupo.merge(grupo, valor, Double::sum);
                        break; // cliente encontrado, não precisa continuar o loop
                    }
                }
            }

            return gerarListaDeValores(totaisPorGrupo);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar integração com RBX: " + e.getMessage(), e);
        }
    }

    public List<ResponsePieReact> boletosAbertosPorCidade() {

        try {
            List<ClienteRbxDTO> clientes = buscarClientesRbx(null);

            List<BoletosAbertos> boletos = buscarBoletosAbertos();

            Map<String, Double> totaisPorGrupo = new HashMap<>();

            for (BoletosAbertos boleto : boletos) {
                for (ClienteRbxDTO cliente : clientes) {
                    if (Objects.equals(boleto.cliente(), cliente.codigo())) {
                        String grupo = cliente.grupo();
                        double valor = boleto.valor();
                        totaisPorGrupo.merge(grupo, valor, Double::sum);
                    }
                }
            }

            return gerarListaDeValores(totaisPorGrupo);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar integração com RBX: " + e.getMessage(), e);
        }
    }

    public BoletosAbertos boletosAbertos(String status) {
        try {
            List<BoletosAbertos> boletos = buscarBoletosAbertos();
            double valorTotal;

            if (status != null) {
                List<ClienteRbxDTO> clientes = buscarClientesRbx(status);

                // Mapa para armazenar um boleto por cliente
                Map<String, BoletosAbertos> boletoUnicoPorCliente = new HashMap<>();

                for (BoletosAbertos boleto : boletos) {
                    for (ClienteRbxDTO cliente : clientes) {
                        if (Objects.equals(boleto.cliente(), cliente.codigo())) {
                            boletoUnicoPorCliente.putIfAbsent(cliente.codigo(), boleto);
                            break; // cliente encontrado, pode parar o loop interno
                        }
                    }
                }

                valorTotal = boletoUnicoPorCliente.values().stream()
                        .mapToDouble(BoletosAbertos::valor)
                        .sum();

            } else {
                // Sem status: soma todos os boletos
                valorTotal = boletos.stream()
                        .mapToDouble(BoletosAbertos::valor)
                        .sum();
            }

            return new BoletosAbertos(valorTotal, null, null);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar integração com RBX: " + e.getMessage(), e);
        }
    }

    public List<ResponsePieReact> totalInadimplentesCidade(String suspenso) {

        if (suspenso != null) {
            try {
                List<ClienteRbxDTO> clientes = buscarClientesRbx("S");

                Map<String, Double> totaisPorGrupo = new HashMap<>();


                for (ClienteRbxDTO cliente : clientes) {

                    String grupo = cliente.grupo();
                    Double valor = 1.0;
                    totaisPorGrupo.merge(grupo, valor, Double::sum);
                }

                return gerarListaDeValores(totaisPorGrupo);
            } catch (Exception e) {
                throw new RuntimeException("Erro ao processar integração com RBX: " + e.getMessage(), e);
            }
        }

        try {
            List<ClienteRbxDTO> clientes = buscarClientesRbx("B");

            Map<String, Double> totaisPorGrupo = new HashMap<>();


            for (ClienteRbxDTO cliente : clientes) {

                String grupo = cliente.grupo();
                Double valor = 1.0;
                totaisPorGrupo.merge(grupo, valor, Double::sum);
            }

            return gerarListaDeValores(totaisPorGrupo);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar integração com RBX: " + e.getMessage(), e);
        }

    }

    public List<ClientesInadimplentesDTO> clientesInadimplentes(String suspenso) {


        if (suspenso != null) {
            try {
                List<ClienteRbxDTO> clientes = buscarClientesRbx("S");
                List<BoletosAbertos> boletos = buscarBoletosAbertos();

                // Agrupa boletos por cliente
                Map<String, List<BoletosAbertos>> mapaBoletos = boletos.stream()
                        .collect(Collectors.groupingBy(BoletosAbertos::cliente));

                List<ClientesInadimplentesDTO> resultado = new ArrayList<>();

                for (ClienteRbxDTO cliente : clientes) {
                    String codigo = cliente.codigo();

                    // Se o cliente não tem boleto, ignora
                    List<BoletosAbertos> boletosCliente = mapaBoletos.get(codigo);
                    if (boletosCliente == null || boletosCliente.isEmpty()) {
                        continue;
                    }

                    // Usa o primeiro boleto apenas
                    BoletosAbertos boleto = boletosCliente.get(0);

                    // Converte grupo para nome
                    String grupoNome = converterIdEmNome(cliente.grupo());

                    // Cria novo ClienteRbxDTO com nome do grupo
                    ClienteRbxDTO clienteComGrupoNome = new ClienteRbxDTO(
                            cliente.codigo(),
                            cliente.nome(),
                            cliente.telComercial(),
                            cliente.telResidencial(),
                            cliente.telCelular(),
                            cliente.endereco(),
                            cliente.numero(),
                            cliente.complemento(),
                            cliente.bairro(),
                            cliente.cidade(),
                            cliente.uf(),
                            cliente.cep(),
                            grupoNome,
                            cliente.situacao()
                    );
                    var diasAtrasado = calculoDiferencaDias(boleto.vencimento(), LocalDate.now().toString());
                    resultado.add(new ClientesInadimplentesDTO(clienteComGrupoNome, boleto.valor(), boleto.vencimento(), diasAtrasado));
                }

                return resultado;

            } catch (Exception e) {
                throw new RuntimeException("Erro ao processar integração com RBX: " + e.getMessage(), e);
            }
        }

        try {
            List<ClienteRbxDTO> clientes = buscarClientesRbx("B");
            List<BoletosAbertos> boletos = buscarBoletosAbertos();
            List<ClientesInadiplentesRbxDTO> clientesInadiplentesRbx = buscarClientesInadiplentes();

            // Mapas para acesso rápido
            Map<String, ClientesInadiplentesRbxDTO> mapaInadiplentesRbx = clientesInadiplentesRbx.stream()
                    .collect(Collectors.toMap(ClientesInadiplentesRbxDTO::codigo, Function.identity()));

            // Agrupa boletos por cliente
            Map<String, List<BoletosAbertos>> mapaBoletos = boletos.stream()
                    .collect(Collectors.groupingBy(BoletosAbertos::cliente));

            List<ClientesInadimplentesDTO> resultado = new ArrayList<>();

            for (ClienteRbxDTO cliente : clientes) {
                String codigo = cliente.codigo();

                // Se o cliente não tem boleto, ignora
                List<BoletosAbertos> boletosCliente = mapaBoletos.get(codigo);
                if (boletosCliente == null || boletosCliente.isEmpty()) {
                    continue;
                }

                // Usa o primeiro boleto apenas
                BoletosAbertos boleto = boletosCliente.get(0);
                ClientesInadiplentesRbxDTO clienteRbx = mapaInadiplentesRbx.get(codigo);

                // Converte grupo para nome
                String grupoNome = converterIdEmNome(cliente.grupo());

                // Cria novo ClienteRbxDTO com nome do grupo
                ClienteRbxDTO clienteComGrupoNome = new ClienteRbxDTO(
                        cliente.codigo(),
                        cliente.nome(),
                        cliente.telComercial(),
                        cliente.telResidencial(),
                        cliente.telCelular(),
                        cliente.endereco(),
                        cliente.numero(),
                        cliente.complemento(),
                        cliente.bairro(),
                        cliente.cidade(),
                        cliente.uf(),
                        cliente.cep(),
                        grupoNome,
                        cliente.situacao()
                );

                var diasAtrasado = calculoDiferencaDias(boleto.vencimento(), LocalDate.now().toString());

                resultado.add(new ClientesInadimplentesDTO(clienteComGrupoNome, boleto.valor(), clienteRbx, boleto.vencimento(), diasAtrasado));
            }

            return resultado;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar integração com RBX: " + e.getMessage(), e);
        }
    }

    public TotalInadimplenteDTO totalInadimplentes(String status) {
        if (status != null) {
            try {
                var total = buscarClientesRbx("S").size();
                return new TotalInadimplenteDTO(total);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        try {
            var total = buscarClientesRbx("B").size();
            return new TotalInadimplenteDTO(total);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public List<ClienteFiltradoDTO> buscarClienteId(Long id) {
        var corpoMessage = """
                {
                   "ConsultaClientes": {
                      "Autenticacao": {
                         "ChaveIntegracao": "%s"
                      },
                      "Filtro": "Codigo = '%d'"
                   }
                }
                """.formatted(chaveApi, id);
        try {
            return integracaoRbx.fazerRequest(
                    corpoMessage,
                    new TypeReference<RespostaAPI<ClienteFiltradoDTO>>() {
                    }
            );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public List<ClienteRbxDTO> buscarClientesSuspensoSemCobrança() {
        try {
            List<BoletosAbertos> boletos = buscarBoletosAbertos();
            List<ClienteRbxDTO> clientes = buscarClientesRbx("S");

            // Coleta todos os códigos de cliente com boleto
            Set<String> clientesComBoleto = boletos.stream()
                    .map(BoletosAbertos::cliente)
                    .collect(Collectors.toSet());

            // Filtra os clientes que não estão na lista de boletos
            List<ClienteRbxDTO> clientesSemBoleto = clientes.stream()
                    .filter(cliente -> !clientesComBoleto.contains(cliente.codigo()))
                    .collect(Collectors.toList());

            return clientesSemBoleto;

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private List<ClienteRbxDTO> buscarClientesRbx(String status) throws Exception {

        String bodyClientes;
        if (status != null) {
            bodyClientes = """
                        {
                           "ConsultaClientes": {
                              "Autenticacao": {
                                 "ChaveIntegracao": "%s"
                              },
                              "Filtro": "Situacao = '%s'"
                           }
                        }
                    """.formatted(chaveApi, status);
        } else {
            bodyClientes = """
                        {
                           "ConsultaClientes": {
                              "Autenticacao": {
                                 "ChaveIntegracao": "%s"
                              },
                              "Filtro": ""
                           }
                        }
                    """.formatted(chaveApi);
        }

        return integracaoRbx.fazerRequest(
                bodyClientes,
                new TypeReference<RespostaAPI<ClienteRbxDTO>>() {
                }
        );

    }

    private List<BoletosAbertos> buscarBoletosAbertos() throws Exception {
        var corpoBoletoAberto = """
                {
                   "ConsultaDocumentosAbertos": {
                      "Autenticacao": {
                         "ChaveIntegracao": "%s"
                      },
                      "Filtro": "Historico = 'Documento a Receber'"
                   }
                }
                """.formatted(chaveApi);

        return integracaoRbx.fazerRequest(
                corpoBoletoAberto,
                new TypeReference<RespostaAPI<BoletosAbertos>>() {
                }
        );

    }

    private List<ClientesInadiplentesRbxDTO> buscarClientesInadiplentes() throws Exception {
        var corpoMessage = """
                {
                   "ConsultaClientesBloqueados": {
                      "Autenticacao": {
                         "ChaveIntegracao": "%s"
                      },
                      "Filtro": ""
                   }
                }
                """.formatted(chaveApi);

        return integracaoRbx.fazerRequest(
                corpoMessage,
                new TypeReference<RespostaAPI<ClientesInadiplentesRbxDTO>>() {
                }
        );
    }

    private List<ResponsePieReact> gerarListaDeValores(Map<String, Double> totais) {
        List<ResponsePieReact> lista = new ArrayList<>();

        lista.add(new ResponsePieReact("Pirabas", totais.getOrDefault("10", 0.0) + totais.getOrDefault("36", 0.0)));
        lista.add(new ResponsePieReact("Primavera", totais.getOrDefault("11", 0.0)));
        lista.add(new ResponsePieReact("Santarem novo", totais.getOrDefault("13", 0.0)));
        lista.add(new ResponsePieReact("Quatipuru", totais.getOrDefault("15", 0.0)));
        lista.add(new ResponsePieReact("Boa vista", totais.getOrDefault("16", 0.0)));
        lista.add(new ResponsePieReact("Magalhães Barata", totais.getOrDefault("26", 0.0)));
        lista.add(new ResponsePieReact("Maracanã", totais.getOrDefault("32", 0.0)));
        lista.add(new ResponsePieReact("Marapanim", totais.getOrDefault("33", 0.0)));
        lista.add(new ResponsePieReact("Salinopolis", totais.getOrDefault("34", 0.0)));

        return lista;
    }

    private static String converterIdEmNome(String id) {
        return switch (id) {
            case "10", "36" -> "Pirabas";
            case "11" -> "Primavera";
            case "13" -> "Santarém Novo";
            case "15" -> "Quatipuru";
            case "16" -> "Boa Vista";
            case "26" -> "Magalhães Barata";
            case "32" -> "Maracanã";
            case "33" -> "Marapanim";
            case "34" -> "Salinópolis";
            default -> id; // fallback: mantém o código se não mapear
        };
    }

    private List<BoletosBaixadosRbxDTO> boletosBaixados(String data) throws Exception {

        var corpoMessage = """
                {
                    "ConsultaDocumentosBaixados": {
                       "Autenticacao": {
                          "ChaveIntegracao": "%s"
                       },
                       "Filtro": "Movimento.DataBaixa = '%s'"
                    }
                 }
                """.formatted(chaveApi, data);

        return integracaoRbx.fazerRequest(
                corpoMessage,
                new TypeReference<RespostaAPI<BoletosBaixadosRbxDTO>>() {
                }
        );
    }

    public ValorBaixadoDTO buscarValorTotalBoletosBaixados(String data) {
        try {
            List<BoletosBaixadosRbxDTO> boletos = boletosBaixados(data);

            BigDecimal total = boletos.stream()
                    .map(b -> new BigDecimal(b.valorBaixado().replace(",", ".")))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return new ValorBaixadoDTO(total);

        } catch (Exception e) {
            System.out.println(e);
            return new ValorBaixadoDTO(BigDecimal.ZERO);
        }
    }

    private Long calculoDiferencaDias(String dataInicio, String dataFim){
        LocalDate inicio = LocalDate.parse(dataInicio); // ISO_LOCAL_DATE por padrão
        LocalDate fim = LocalDate.parse(dataFim);

        return ChronoUnit.DAYS.between(inicio, fim);
    }
}
