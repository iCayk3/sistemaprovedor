export const dashboardPalette = ['#0f4c81', '#2f80c0', '#2D9C75', '#f97316', '#8a9f20', '#c89b08', '#d85b72', '#8064c8', '#8aa0ad'];

export const dashboardShellSx = {
    bgcolor: '#f5f8fb',
    p: { xs: 1, md: 1.5 },
    borderRadius: 1,
    border: '1px solid #c9dce2',
    '.dark &': {
        bgcolor: '#070b18',
        borderColor: 'rgba(23, 226, 232, 0.22)',
    },
};

export const dashboardHeaderSx = {
    p: 1.8,
    mb: 2,
    borderRadius: 1,
    bgcolor: '#0f4c81',
    color: '#fff',
    border: '1px solid #0b3f6b',
    borderBottom: '3px solid #f97316',
    '.dark &': {
        bgcolor: '#1677bd',
        borderColor: '#17e2e8',
    },
};

export const dashboardPanelSx = {
    bgcolor: '#ffffff',
    color: '#0f2630',
    border: '1px solid #c9dce2',
    borderRadius: 1.5,
    boxShadow: '0 8px 22px rgba(15, 38, 48, 0.06)',
    '.dark &': {
        bgcolor: '#121329',
        color: '#f8fbff',
        borderColor: '#0b7fbd',
        boxShadow: '0 0 0 1px rgba(23, 226, 232, 0.25), 0 0 14px rgba(0, 145, 220, 0.32)',
    },
};

export const dashboardMetricSx = {
    ...dashboardPanelSx,
    p: 2,
    borderLeft: '5px solid #0f4c81',
    '.dark &': {
        ...dashboardPanelSx['.dark &'],
        borderLeftColor: '#17e2e8',
    },
};

export const dashboardChartSx = {
    '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#31545f !important' },
    '& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label': { fill: '#0f2630 !important' },
    '& .MuiChartsLegend-label': { fill: '#0f2630 !important' },
    '& .MuiChartsGrid-line': { stroke: 'rgba(15,38,48,0.12)' },
    '.dark & .MuiChartsAxis-line, .dark & .MuiChartsAxis-tick': { stroke: '#dce8f5 !important' },
    '.dark & .MuiChartsAxis-tickLabel, .dark & .MuiChartsAxis-label': { fill: '#f8fbff !important' },
    '.dark & .MuiChartsLegend-label': { fill: '#f8fbff !important' },
    '.dark & .MuiChartsGrid-line': { stroke: 'rgba(255,255,255,0.12)' },
};

export const dashboardInputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#ffffff',
        color: '#0f2630',
        '& fieldset': { borderColor: '#b9d0d8' },
        '&:hover fieldset': { borderColor: '#0f4c81' },
        '&.Mui-focused fieldset': { borderColor: '#0f4c81' },
    },
    '& .MuiInputBase-input': { color: '#0f2630', colorScheme: 'light', fontWeight: 700 },
    '& .MuiInputLabel-root': { color: '#31545f', fontWeight: 700 },
    '& .MuiInputLabel-root.Mui-focused': { color: '#0f4c81' },
    '& .MuiSvgIcon-root': { color: '#0f2630' },
    '.dark & .MuiOutlinedInput-root': {
        bgcolor: '#111a2e',
        color: '#f8fbff',
        '& fieldset': { borderColor: '#17e2e8' },
        '&:hover fieldset': { borderColor: '#7befff' },
        '&.Mui-focused fieldset': { borderColor: '#7befff' },
    },
    '.dark & .MuiInputBase-input': { color: '#f8fbff', colorScheme: 'dark' },
    '.dark & .MuiInputLabel-root': { color: '#b8f7ff' },
    '.dark & .MuiInputLabel-root.Mui-focused': { color: '#7befff' },
    '.dark & .MuiSvgIcon-root': { color: '#f8fbff' },
};

export const dashboardHeaderInputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#f8fbff',
        color: '#0f2630',
        '& fieldset': { borderColor: '#d7e5ea' },
        '&:hover fieldset': { borderColor: '#fdba74' },
        '&.Mui-focused fieldset': { borderColor: '#fdba74' },
    },
    '& .MuiSelect-select': { color: '#0f2630', fontWeight: 900 },
    '& .MuiInputBase-input': { color: '#0f2630', colorScheme: 'light', fontWeight: 900 },
    '& .MuiInputLabel-root': { color: '#0f2630', fontWeight: 900 },
    '& .MuiInputLabel-root.Mui-focused': { color: '#0f2630' },
    '& .MuiSvgIcon-root': { color: '#0f2630' },
    '.dark & .MuiOutlinedInput-root': {
        bgcolor: '#f8fbff',
        color: '#0f2630',
        '& fieldset': { borderColor: '#d7e5ea' },
        '&:hover fieldset': { borderColor: '#fdba74' },
        '&.Mui-focused fieldset': { borderColor: '#fdba74' },
    },
    '.dark & .MuiSelect-select': { color: '#0f2630' },
    '.dark & .MuiInputBase-input': { color: '#0f2630', colorScheme: 'light' },
    '.dark & .MuiInputLabel-root': { color: '#0f2630' },
    '.dark & .MuiInputLabel-root.Mui-focused': { color: '#0f2630' },
    '.dark & .MuiSvgIcon-root': { color: '#0f2630' },
};

export const dashboardHeaderButtonSx = {
    color: '#ffffff',
    borderColor: 'rgba(255,255,255,0.65)',
    bgcolor: 'rgba(255,255,255,0.08)',
    fontWeight: 800,
    '&:hover': {
        borderColor: '#ffffff',
        bgcolor: 'rgba(255,255,255,0.16)',
    },
    '&.Mui-disabled': {
        color: 'rgba(255,255,255,0.55)',
        borderColor: 'rgba(255,255,255,0.28)',
    },
    '& .MuiSvgIcon-root': {
        color: 'inherit',
    },
};

export const dashboardSubtleTextSx = {
    color: '#496872',
    '.dark &': { color: '#7befff' },
};

export const dashboardMutedTextSx = {
    color: '#607d87',
    '.dark &': { color: '#c9d7e8' },
};
