package br.com.w4solution.controle_instalacao.services.rbx;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RespostaAPI<T> {
    private int status;
    private String erro_code;
    private String erro_inf;
    private String erro_desc;
    private String erro_detail;
    private List<T> result;
}