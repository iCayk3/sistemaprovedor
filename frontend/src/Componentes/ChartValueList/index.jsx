import { Box, Stack, Typography } from '@mui/material';

const defaultColors = ['#4454f6', '#ffb627', '#ff5b6e', '#28b8ee', '#2fc878', '#ec79c1', '#8e6ce8', '#19b5a5', '#8aa0ad'];

function formatDefault(value) {
    return Number(value || 0).toLocaleString('pt-BR');
}

const ChartValueList = ({
    items = [],
    valueFormatter = formatDefault,
    showPercent = true,
    maxHeight = 240,
}) => {
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

    return (
        <Stack
            spacing={1}
            sx={{
                maxHeight,
                overflowY: 'auto',
                pr: 0.5,
                minWidth: 0,
            }}
        >
            {items.map((item, index) => {
                const percent = total ? ((Number(item.value || 0) / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                const color = item.color || defaultColors[index % defaultColors.length];

                return (
                    <Box
                        className="chart-value-list-row"
                        key={`${item.label}-${index}`}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '12px minmax(0, 1fr) auto',
                            gap: 1,
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            px: 1,
                            py: 0.8,
                        }}
                    >
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                fontWeight={800}
                                title={item.label}
                                sx={{ overflowWrap: 'anywhere', lineHeight: 1.25 }}
                            >
                                {item.label}
                            </Typography>
                            {showPercent && <Typography color="text.secondary" variant="caption">{percent}% do total</Typography>}
                        </Box>
                        <Typography fontWeight={800} whiteSpace="nowrap">{valueFormatter(item.value)}</Typography>
                    </Box>
                );
            })}
        </Stack>
    );
};

export default ChartValueList;
