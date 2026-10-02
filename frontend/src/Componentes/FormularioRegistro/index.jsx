import React, { useEffect, useState } from 'react';
import FieldAutoComplet from '../FieldAutoComplet';
import BasicDatePicker from '../BasicDatePicker';
import dayjs from 'dayjs';
import TextoInput from '../TextoInput';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNotification } from '../NotificationProvider';
import Api from '../../Services/Api';

const DivFormEstilizada = styled('div')(() => ({
  width: '100%',
  // padding: '10px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  boxSizing: 'border-box',

  '& .form-grid': {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    boxSizing: 'border-box',
  },

  '& .submit-button': {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1E3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
    '&:hover': {
      backgroundColor: '#E14F01',
    },
  },

  '& .data-pick': {
    height: '56px',
    alignItems: 'center',
    marginBottom: '8px',
    '& input': {
      fontSize: '16px',
    },
  },

  '& .controll-form': {
    marginTop: '8px',
  },

  '@media only screen and (max-width:1300px)': {
    '& .form-grid': {
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
  },
  '@media only screen and (max-width:998px)': {
    '& .form-grid': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
  },
  '@media only screen and (max-width:768px)': {
    '& .form-grid': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
  '@media only screen and (max-width:600px)': {
    '& .form-grid': {
      gridTemplateColumns: 'repeat(1, 1fr)',
    },
  },
}));
const UseApi = Api()

const FormularioRegistro = ({ onFormSubmit, procedimentos }) => {



  // Estados para armazenar os valores dos campos
  const [codigo, setCodigo] = useState('');
  const [login, setLogin] = useState('');
  const [mac, setMac] = useState('');
  const [olt, setOlt] = useState('');
  const [oltInput, setOltInput] = useState('')
  const [cto, setCto] = useState('');
  const [ctoInput, setCtoInput] = useState('')
  const [porta, setPorta] = useState('');
  const [portaInput, setPortaInput] = useState('')
  const [tecnico, setTecnico] = useState('');
  const [tecnicoInput, setTecnicoInput] = useState('')
  const [procedimento, setProcedimento] = useState('');
  const [inputProcedimento, setInputProcedimento] = useState('')
  const [ctoAntiga, setCtoAntiga] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [dataregistro, setData] = useState('');
  const { showSuccess, showError } = useNotification();

  const today = new Date();

  const selectData = (value) => {
    if (value === null) {
      setData(dataregistro);
    } else {
      try {
        setData(value.toISOString().slice(0, 10));
      } catch {
        setData(dataregistro);
      }
    }
  };

  useEffect(() => {
    const today = new Date();
    setData(today.toISOString().slice(0, 10));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o comportamento padrão do formulário

    const formData = {
      codigo: parseInt(codigo, 10),
      olt: parseInt(olt.id, 10),
      cto: parseInt(cto.id, 10),
      porta: parseInt(porta.id, 10),
      tecnico: parseInt(tecnico.id, 10),
      dataregistro,
      procedimento: procedimento.label,
      ctoAntiga,
      localidade,
      observacao,
      login,
      mac
    };

    try {
      const response = await UseApi(`registros`, 'POST', formData);
      onFormSubmit();
      if (!response) {
        throw new Error('Erro ao enviar o formulário');
      }

      showSuccess('Registro cadastrado com sucesso!');
      setCodigo('');
      setLogin('');
      setMac('');
      setOlt('');
      setCto('');
      setPorta('');
      setTecnico('');
      setData(today.toISOString().slice(0, 10));
      setProcedimento('');
      setCtoAntiga('');
      setLocalidade('');
      setObservacao('');
    } catch (error) {
      console.error('Erro na requisição:', error);
      showError(error.message || 'Algo deu errado no cadastro!');
    }
  };

  return (
    <DivFormEstilizada>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className='controll-form'>
            <TextoInput
              valor={codigo}
              obrigatorio
              labelProp={"Codigo"}
              aoAlterado={(evento) => setCodigo(evento.target.value)}
              sx={{width : '100%'}}
            />
          </div>
          <div className='controll-form'>
            <TextoInput
              valor={login}
              labelProp={"Login"}
              aoAlterado={(evento) => setLogin(evento.target.value)}
              sx={{width : '100%'}}
            />
          </div>
          <div className='controll-form'>
            <FieldAutoComplet
              endpoint={'olt'}
              label={"OLT"}
              aoAlterado={setOlt}
              onInputValueChange={setOltInput}
              valor={olt}
              inputValue={oltInput}
            />
          </div>
          <div className='controll-form'>
            {!olt && <FieldAutoComplet desabilitar label="CTO" />}
            {olt && <FieldAutoComplet
              endpoint={`olt/${olt.id}/cto`}
              label="CTO"
              aoAlterado={setCto}
              onInputValueChange={setCtoInput}
              valor={cto}
              inputValue={ctoInput}
            />}
          </div>
          <div className='controll-form'>
            {!cto && <FieldAutoComplet desabilitar label="PORTA" />}
            {cto && <FieldAutoComplet
              endpoint={`olt/cto/${cto.id}/portas`}
              label="PORTA" 
              porta
              aoAlterado={setPorta}
              onInputValueChange={setPortaInput}
              valor={porta}
              inputValue={portaInput}
            />}
          </div>
          <div className='controll-form'>
            <FieldAutoComplet
              endpoint={`tecnico/equipes`}
              obrigatorio
              label={"Técnicos"}
              aoAlterado={setTecnico}
              onInputValueChange={setTecnicoInput}
              valor={tecnico}
              inputValue={tecnicoInput}
            />
          </div>
          <div className='controll-form'>
            <FieldAutoComplet
              dadosProcedimento={procedimentos}
              obrigatorio label={"Procedimento"}
              aoAlterado={setProcedimento}
              onInputValueChange={setInputProcedimento}
              valor={procedimento}
              inputValue={inputProcedimento}
            />
          </div>
          <div className='controll-form'>
            <TextoInput
              valor={mac}
              labelProp={"MAC do Equipamento"}
              aoAlterado={(evento) => setMac(evento.target.value)}
              sx={{width : '100%'}}
            />
          </div>
          <div className='controll-form'>
            <TextoInput
              valor={ctoAntiga}
              labelProp={"CTO antiga"}
              placeholderProp={""}
              aoAlterado={(evento) => setCtoAntiga(evento.target.value)}
              sx={{width : '100%'}}
            />
          </div>
          <div className='controll-form'>
            <TextoInput
              valor={localidade}
              obrigatorio
              labelProp={"Localidade"}
              placeholderProp={""}
              aoAlterado={(evento) => setLocalidade(evento.target.value)}
              sx={{width : '100%'}}
            />
          </div>
          <div className='controll-form'>
            <TextoInput
              valor={observacao}
              labelProp={"Observação"}
              placeholderProp={""}
              aoAlterado={(evento) => setObservacao(evento.target.value)}
              sx={{width : '100%'}}
            />
          </div>
          <div className='data-pick'>
            <BasicDatePicker aoAlterado={(value) => selectData(value)} label={"Selecione a data"} valor={dayjs(dataregistro)} />
          </div>
        </div>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: 3, py: 1.2, fontWeight: 700, borderRadius: 2 }}
        >
          Cadastrar Registro
        </Button>
      </form>
    </DivFormEstilizada>
  );
}

export default FormularioRegistro