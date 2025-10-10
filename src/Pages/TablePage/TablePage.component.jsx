import * as React from 'react'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import styles from "./TablePage.module.css"
import { QRCodeDialog } from '../../Components/QRCodeDialog/QRCodeDialog.component';
import { ThemeProvider, createTheme } from '@mui/material/styles';

function judgeInstance(name, hand, leg, fling, warn) {
  return {
    name, hand, leg, fling, warn
  }
}

const participants = {
  redName: "Иван Иванов Иванович",
  blueName: "Петров Петр Петрович"
}

const judges = [
  "Владиславов Владислав Владиславович", "Данилов Даниил Даниилович", "Никитов Никита Никитич"
];

const scores = [
  "0", "0", "0", "Итог", "0", "0", "0"
]

const rows = [
  "Удар рукой", "Удар ногой", "Бросок", "Предупреждение"
]

export const TablePage = () => {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const theme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
            borderRight: "1px solid #000000",
            "&:last-child":{
              borderRight: "none"
            },
        },
      },
    },
    MuiTableContainer:{
        styleOverrides:{
          root:{
            border: "1px solid #000000",
            borderRadius: "15px"
        }
      }
    },
    MuiChip:{
      styleOverrides:{
        label:{
          fontSize: "1.4rem",
            fontWeight: "400"
        },    
        root:{
          padding: "20px"
        }
      }
    }
  },
});


  const headerTheme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
            borderBottom: "1px solid #000000",
            borderRight: "1px solid #000000",
            "&:last-child":{
              borderRight: "none"
            },
        },
      },
    },
  },
});

  return (
    <ThemeProvider theme={theme}>
      <div className={styles.container}>
        <Stack sx={{width: "100%", justifyContent: 'space-between',}} direction="row" spacing={1}>
          <Chip label={participants.redName} color="primary" />
          <h1>Таблица результатов</h1>
          <Chip label={participants.blueName} color="error" />
        </Stack>
        <TableContainer component={Paper}>
          <Table sx={{
            minWidth: 650,
          }} >
            <TableHead>
              <TableRow>
                <ThemeProvider theme={headerTheme}>
                  {Array.from({length: 7}).map((_, index)=>(
                    <TableCell sx={{padding: 1}} key={index} align='center'>
                      {index !== 3 ? <IconButton color="error">
                        <DeleteIcon />
                      </IconButton> : ""}
                    </TableCell>
                  ))  }
                </ThemeProvider>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <ThemeProvider theme={headerTheme}>
                  <TableCell>{judges[0]}</TableCell>
                  <TableCell>{judges[1]}</TableCell>
                  <TableCell>{judges[2]}</TableCell>
                  <TableCell></TableCell>
                  <TableCell>{judges[0]}</TableCell>
                  <TableCell>{judges[1]}</TableCell>
                  <TableCell>{judges[2]}</TableCell>
                </ThemeProvider>
              </TableRow>
              {rows.map((rowName, rowIndex) => (<TableRow key={rowIndex}>
                {judges.map((_, index) => (<TableCell sx={{borderBottom: rowIndex === 4 ? "none" : "1px solid #000000"}} key={index}></TableCell>))}
                <TableCell align='center' sx={{borderBottom: rowIndex === 4 ? "none" : "1px solid #000000"}} key={rowIndex}>{rowName}</TableCell>
                {judges.map((_, index) => (<TableCell sx={{borderBottom: rowIndex === 4 ? "none" : "1px solid #000000"}} key={index}></TableCell>))}
              </TableRow>))}
              <TableRow>
                {scores.map((value, index) => (<TableCell align='center' key={index}>{value}</TableCell>))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Fab onClick={handleClickOpen} variant="extended" color="primary">
          <QrCode2Icon sx={{ mr: 1 }} />
          QR Код
        </Fab>
        <QRCodeDialog
          open={open}
          onClose={handleClose}
        />
      </div>
    </ThemeProvider>
  );
}

