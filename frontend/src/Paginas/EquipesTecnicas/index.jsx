import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Api from '../../Services/Api';
import ListaEquipe from './ListaEquipes';
import CadastrosEquipes from './CadastrosEquipe';
import EditarEquipes from './EditarEquipes';

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const UseApi = Api()

const EquipesTecnicas = () => {

    const [value, setValue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    const [equipes, setEquipes] = React.useState([])
    const [tecnicos, setTecnicos] = React.useState([])
    const [refresh, setRefresh] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {

            try {
                const response = await UseApi(`tecnico/equipes`);
                setEquipes(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [refresh]);
    React.useEffect(() => {
        const fetchData = async () => {

            try {
                const response = await UseApi(`tecnico/tecnicos`);
                setTecnicos(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [refresh]);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Lista de equipes" {...a11yProps(0)} />
                    <Tab label="Cadastros" {...a11yProps(1)} />
                    <Tab label="Editar Equipes" {...a11yProps(2)} />
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <ListaEquipe rows={equipes}/>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <CadastrosEquipes atualizar={setRefresh}/>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
                <EditarEquipes tecnicos={tecnicos} equipes={equipes} atualizar={setRefresh}/>
            </CustomTabPanel>
        </Box>
    );
}

export default EquipesTecnicas