import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker, MobileDatePicker } from '@mui/x-date-pickers';
import 'dayjs/locale/pt';
import { Box, useMediaQuery } from '@mui/material';

const currentYear = dayjs();

export default function BasicDatePicker({ aoAlterado, label, views, open, valor, sx, textFieldSx }) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const Picker = isMobile ? MobileDatePicker : DatePicker;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt">
      <Box sx={{ pt: 1, width: '100%', ...sx }}>
        <Picker
          sx={{ width: '100%' }}
          value={valor}
          label={label}
          onChange={aoAlterado}
          views={views}
          maxDate={currentYear}
          openTo={open}
          slotProps={{
            textField: {
              sx: textFieldSx,
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
