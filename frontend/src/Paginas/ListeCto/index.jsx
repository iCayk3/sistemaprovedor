import { useMemo, useState } from "react";
import FieldAutoComplet from "../../Componentes/FieldAutoComplet";
import Api from "../../Services/Api";
import { debounce } from "lodash";
import TabelaSubItens from "../../Componentes/TabelaSubItens";
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import TextoInput from "../../Componentes/TextoInput";

const UseApi = Api();

const ListeCto = () => {
  const [olt, setOlt] = useState([]);
  const [ctos, setCtos] = useState([]);
  const [oltInput, setOltInput] = useState('');
  const [portasPorCto, setPortasPorCto] = useState({});
  const [loadingCtos, setLoadingCtos] = useState(false);
  const [ctoBusca, setCtoBusca] = useState('');

  const carregarCtos = (e, forcar = false) => {
    if (!e) {
      setOlt([]);
      setCtos([]);
      return;
    }

    if (!forcar && e?.id === olt?.id && ctos.length > 0) return;

    setOlt(e);
    setLoadingCtos(true);

    const fetchData = async () => {
      try {
        const response = await UseApi(`olt/${e.id}/cto`);
        if (Array.isArray(response)) {
          setCtos(response.sort());
          setPortasPorCto({});
        } else {
          console.warn("Resposta inesperada:", response);
        }
      } catch (error) {
        console.error('Erro ao buscar CTOs:', error);
      } finally {
        setLoadingCtos(false);
      }
    };

    fetchData();
  };

  const debouncedInputChange = useMemo(() => debounce(setOltInput, 300), []);

  const ctosFiltrados = useMemo(() => {
    if (!ctoBusca) return ctos;
    return ctos.filter((cto) =>
      cto.label?.toLowerCase().includes(ctoBusca.toLowerCase())
    );
  }, [ctos, ctoBusca]);

  return (
    <>
      <FieldAutoComplet
        endpoint={'olt'}
        label={"OLT"}
        aoAlterado={(e) => carregarCtos(e)}
        onInputValueChange={debouncedInputChange}
        valor={olt}
        inputValue={oltInput}
      />

      <TextoInput
        labelProp={"Buscar CTO"}
        sx={{ marginTop: 2 }}
        valor={ctoBusca}
        aoAlterado={(e) => setCtoBusca(e.target.value)}
      />

      <TabelaSubItens ctoData={ctosFiltrados} />

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        open={loadingCtos}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" />
          <div style={{ marginTop: 16, fontSize: '1.2rem' }}>Carregando CTOs...</div>
        </div>
      </Backdrop>
    </>
  );
};

export default ListeCto;
