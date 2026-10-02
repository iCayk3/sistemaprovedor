export const defaultStatusOptions = ['Cobrança emitida', 'Promessa de pagamento', 'Sem retorno', 'Pago', 'Cancelado'];

export const defaultActionOptions = [
    'Contato',
    'Sem retorno',
    'Promessa de pagamento',
    'Acordo',
    'Segunda via enviada',
    'Contestacao',
    'Negativacao',
    'Pago',
];

export const clientGroupNames = {
    9: 'PADRAO',
    10: 'SJP',
    11: 'PMV',
    13: 'STN',
    15: 'QT',
    16: 'BV',
    17: 'SEM COBRANCA',
    26: 'MB',
    32: 'MRC',
    33: 'MRP',
    34: 'SAL',
    36: 'RADIO - PIRABAS',
    40: 'TESTE',
    41: 'PRE',
    42: 'CON',
    43: 'SOL',
};

export const emptyForm = {
    acao: 'Contato',
    codigoCliente: '',
    numeroContrato: '',
    boletoSelecionado: '',
    cliente: '',
    grupoCliente: '',
    data: new Date().toISOString().slice(0, 10),
    dataVencimento: '',
    dataPromessa: '',
    valor: '',
    valorPago: '',
    status: 'Cobrança emitida',
    observacao: '',
};

export const pageGridSx = {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: {
        xs: '1fr',
        md: 'repeat(2, minmax(0, 1fr))',
        lg: 'repeat(4, minmax(0, 1fr))',
    },
};

export const formGridSx = {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(6, minmax(0, 1fr))',
    },
};

export const fieldSpan = {
    third: { xs: 'span 1', sm: 'span 1', md: 'span 2' },
    half: { xs: 'span 1', sm: 'span 1', md: 'span 3' },
    full: { xs: 'span 1', sm: 'span 2', md: 'span 6' },
};

export function formatClientGroup(group) {
    const normalized = String(group || '').trim();
    return clientGroupNames[normalized] || normalized;
}

export function isFinalStatus(status) {
    return ['PAGO', 'FECHADO', 'CANCELADO'].includes(String(status || '').trim().toUpperCase());
}

export function isClosedStatus(status) {
    return String(status || '').trim().toUpperCase() === 'FECHADO';
}

export function isPromiseStatus(status) {
    return String(status || '').trim().toUpperCase() === 'PROMESSA DE PAGAMENTO';
}

export function isPaidStatus(status) {
    return String(status || '').trim().toUpperCase() === 'PAGO';
}

export function allowsOriginalValueChange(status) {
    return ['NEGOCIACAO', 'NEGOCIAÇÃO', 'EM NEGOCIACAO', 'EM NEGOCIAÇÃO', 'PROMESSA DE PAGAMENTO']
        .includes(String(status || '').trim().toUpperCase());
}

export function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

export function currentMonthIso() {
    return new Date().toISOString().slice(0, 7);
}

export function isSameMonth(value, month) {
    if (!value || !month) return false;
    return String(value).slice(0, 7) === month;
}

export function needsSevenDayReminder(charge) {
    if (charge.excluded || charge.serviceSituation === 'Fechada') return false;
    const lastMovement = charge.updatedAt || charge.createdAt;
    if (!lastMovement) return false;
    const limit = new Date();
    limit.setDate(limit.getDate() - 7);
    return new Date(lastMovement) <= limit;
}

export function normalizeCharge(charge) {
    return {
        id: charge.id,
        protocol: charge.protocolo,
        action: charge.acao,
        clientCode: charge.codigoCliente,
        contractNumber: charge.numeroContrato,
        documentNumber: charge.documentoTitulo,
        client: charge.cliente,
        clientGroup: formatClientGroup(charge.grupoCliente),
        date: charge.data,
        dueDate: charge.dataVencimento,
        promiseDate: charge.dataPromessa,
        value: Number(charge.valor || 0),
        paidValue: charge.valorPago == null ? null : Number(charge.valorPago),
        status: charge.status || 'Cobrança emitida',
        serviceSituation: charge.situacaoAtendimento || (isFinalStatus(charge.status) ? 'Fechada' : 'Aberta'),
        notes: charge.observacao,
        createdAt: charge.criadoEm,
        updatedAt: charge.atualizadoEm,
        closedAt: charge.fechadoEm,
        createdBy: charge.criadoPor,
        updatedBy: charge.atualizadoPor,
        lastUser: charge.ultimoUsuario || charge.atualizadoPor || charge.criadoPor || '',
        automatic: Boolean(charge.geradaAutomaticamente),
        responsible: charge.responsavel || '',
        capturedAt: charge.capturadoEm,
        rbxStatus: charge.statusIntegracaoRbx || '',
        rbxTicket: charge.atendimentoRbxNumero || '',
        editable: charge.editavel !== false,
        excluded: Boolean(charge.excluida),
        excludedAt: charge.excluidoEm,
        excludedBy: charge.excluidoPor,
        exclusionReason: charge.motivoExclusao,
        history: Array.isArray(charge.historico)
            ? charge.historico.map((item) => ({
                id: item.id,
                previousStatus: item.statusAnterior,
                nextStatus: item.statusNovo,
                previousValue: Number(item.valorAnterior || 0),
                nextValue: Number(item.valorNovo || 0),
                notes: item.observacao,
                user: item.usuario,
                createdAt: item.criadoEm,
            }))
            : [],
    };
}

export function toForm(charge) {
    return {
        acao: charge?.action || 'Contato',
        codigoCliente: charge?.clientCode || '',
        numeroContrato: charge?.contractNumber || '',
        boletoSelecionado: charge?.documentNumber || '',
        cliente: charge?.client || '',
        grupoCliente: charge?.clientGroup || '',
        data: charge?.date || new Date().toISOString().slice(0, 10),
        dataVencimento: charge?.dueDate || '',
        dataPromessa: charge?.promiseDate || '',
        valor: charge?.value ? String(charge.value) : '',
        valorPago: charge?.paidValue != null ? String(charge.paidValue) : '',
        status: charge?.status || 'Cobrança emitida',
        observacao: charge?.notes || '',
    };
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

export function formatConfiguredOption(value, defaults) {
    const text = String(value || '').trim();
    const known = defaults.find((item) => item.localeCompare(text, 'pt-BR', { sensitivity: 'base' }) === 0);
    if (known) return known;
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : '';
}

export function formatDate(value) {
    if (!value) return 'Não informado';
    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

export function readClientField(cliente, lowerKey, upperKey) {
    return cliente?.[lowerKey] ?? cliente?.[upperKey] ?? '';
}

export function normalizeClientCode(value) {
    return String(value ?? '').replace(/\D/g, '');
}

export function normalizeRbxClient(response) {
    const payload = response?.data || response;
    const client = Array.isArray(payload) ? payload[0] : payload?.cliente || payload;
    const contratosPayload = Array.isArray(payload?.contratos) ? payload.contratos : [];

    if (!client || typeof client !== 'object') {
        return null;
    }

    return {
        codigo: readClientField(client, 'codigo', 'Codigo'),
        nome: readClientField(client, 'nome', 'Nome'),
        cpfCnpj: readClientField(client, 'cpfCnpj', 'CNPJ_CNPF'),
        sigla: readClientField(client, 'sigla', 'Sigla'),
        grupo: formatClientGroup(readClientField(client, 'grupoNome', 'Grupo_Nome') || readClientField(client, 'grupo', 'Grupo')),
        situacao: readClientField(client, 'situacao', 'Situacao'),
        contratos: contratosPayload.map((contrato) => ({
            numero: readClientField(contrato, 'numero', 'Numero'),
            plano: readClientField(contrato, 'plano', 'Plano'),
            situacao: readClientField(contrato, 'situacao', 'Situacao'),
            boletos: (Array.isArray(contrato.boletos) ? contrato.boletos : []).map((boleto, index) => ({
                id: readClientField(boleto, 'documento', 'Documento') || `${readClientField(boleto, 'vencimento', 'Vencimento')}-${index}`,
                documento: readClientField(boleto, 'documento', 'Documento'),
                valor: Number(readClientField(boleto, 'valor', 'Valor') || 0),
                vencimento: readClientField(boleto, 'vencimento', 'Vencimento'),
            })),
        })),
    };
}

export function formatClientStatus(status) {
    const normalized = String(status || '').trim().toUpperCase();
    const statuses = {
        A: 'Ativo',
        B: 'Bloqueado',
        N: 'Inativo',
        S: 'Suspenso',
    };

    return statuses[normalized] || status || '';
}

export function normalizeLabel(value, fallback = 'Não informado') {
    return String(value || '').trim() || fallback;
}

export function countBy(items, selector) {
    return items.reduce((acc, item) => {
        const key = normalizeLabel(selector(item));
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
}

export function sumBy(items, selector, valueSelector) {
    return items.reduce((acc, item) => {
        const key = normalizeLabel(selector(item));
        acc[key] = (acc[key] || 0) + Number(valueSelector(item) || 0);
        return acc;
    }, {});
}

export function compactChartEntries(entries, limit = 8) {
    if (entries.length <= limit) return entries;
    const visible = entries.slice(0, limit - 1);
    const othersTotal = entries.slice(limit - 1).reduce((total, [, value]) => total + Number(value || 0), 0);
    return [...visible, ['Outros', othersTotal]];
}
