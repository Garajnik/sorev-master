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
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import styles from "./TablePage.module.css";
import { QRCodeDialog } from '../../Components/QRCodeDialog/QRCodeDialog.component';
import { DisconnectDialog } from "../../Components/DisconnectDialog/DisconnectDialog.component.jsx";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ScoreChip } from '../../Components/index.js';

// TODO: Create participants logic
const participants = {
  redName: "Иван Иванов Иванович",
  blueName: "Петров Петр Петрович"
}

export const TablePage = () => {
  const [openQR, setOpenQR] = React.useState(false);
  const [openD, setOpenD] = React.useState(false);
  const [selectedJudge, setSelectedJudge] = React.useState("")
  const [judges, setJudges] = React.useState([])
  const [columns, setColumns] = React.useState([])

  const rows = judges.length === 0 ? ["Нажмите на кнопку, чтобы подключить судей"] : [
    "Удар рукой", "Удар ногой", "Бросок", "Предупреждение"
  ]

  const createColumn = (judgeName, participantColor) => {
    return { judgeName, participantColor }
  }


  const getJudges = () => {
    const judgeList = {}
    judges.forEach((value, index) => judgeList[value] = `judge${index + 1}`)
    return judgeList
  }

  const scores = {
    "blue": {
      "judge1": {
        "hand": [1, 2, 3],
        "leg": [5],
        "throw": [6],
        "warn": ["П"],
      },
      "judge2": {
        "hand": [],
        "leg": [],
        "throw": [],
        "warn": [],
      },
      "judge3": {
        "hand": [],
        "leg": [],
        "throw": [],
        "warn": [],
      }
    },
    "red": {
      "judge1": {
        "hand": [4, 5, 5],
        "leg": [1],
        "throw": [2],
        "warn": [],
      },
      "judge2": {
        "hand": [],
        "leg": [],
        "throw": [],
        "warn": [],
      },
      "judge3": {
        "hand": [],
        "leg": [],
        "throw": [],
        "warn": [],
      }
    }
  }

  function getScoreElement(color, judge, punch) {
    const colors = {
      0: "blue",
      1: "red"
    }

    const judges = getJudges()

    const punches = {
      0: "hand",
      1: "leg",
      2: "throw",
      3: "warn",
    }
    return scores[colors[color]][judges[judge]][punches[punch]]
  }

  function setScoreElement(color, judge, punch, score) {
    const colors = {
      0: "blue",
      1: "red"
    }
    const judges = judgeList

    const punches = {
      0: "hand",
      1: "leg",
      2: "throw",
      3: "warn",
    }
    console.log(color, judge, punch, score)
    scores[colors[color]][judges[judge]][punches[punch]] = score
  }

  React.useEffect(() => {
    var ws = new WebSocket(`ws://localhost:8000/ws/mainJudge`);
    ws.onopen = () => { console.log("Connected to WebSocket") }
    ws.onmessage = function (event) {
      let data = JSON.parse(event.data)
      // Checking if we receiving score or connection
      console.log(data)
      if (data.data === "judgeupd") {
        setJudges(data.judges)
      }
      else if (data.data === "score") {
        console.log(data.score)
        setScoreElement(data.score.color, data.score.judge, data.score.punch, data.score.score)
      }
    }
    return () =>
      ws.close()
  }, [])

  React.useEffect(() => {
    fillScores()
  }, [judges])

  const fillScores = () => {
    setColumns([])
    const currentScores = []
    for (let i = 0; i < judges.length * 2; i++) {
      currentScores.push(createColumn(judges[i % judges.length], i < judges.length - 1 / 2 ? 'blue' : 'red'))
    }
    setColumns(currentScores)
  }

  const handleClickOpenQR = () => {
    setOpenQR(true);
  };

  const handleCloseQR = () => {
    setOpenQR(false);
  };

  const handleClickOpenD = (judgeIndex) => {
    setSelectedJudge(judges[judgeIndex % (judges.length + 1)])
    setOpenD(true);
  };

  const handleCloseD = () => {
    setOpenD(false);
  };

  const handleApprove = () => {
    const request = new Request(`http://localhost:8000/kick_judge/${selectedJudge}`)
    fetch(request).then(response => console.log(response))
    console.log(`Disconnected judge ${selectedJudge}`)
  }

  const theme = createTheme({
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderRight: "1px solid grey",
            "&:last-child": {
              borderRight: "none"
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            border: "1px solid grey",
            borderRadius: "15px"
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          label: {
            fontSize: "1.4rem",
            fontWeight: "400"
          },
          root: {
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
            borderBottom: "1px solid grey",
            borderRight: "1px solid grey",
            "&:last-child": {
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
        <Stack sx={{ width: "100%", justifyContent: 'space-between', }} direction="row" spacing={1}>
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
                  {Array.from({ length: judges.length * 2 + 1 }).map((_, index) => (
                    <TableCell sx={{ padding: 1 }} key={index} align='center'>
                      {index !== judges.length ? <IconButton color="error" onClick={() => handleClickOpenD(index)}>
                        <HighlightOffIcon />
                      </IconButton> : <></>}
                    </TableCell>
                  ))}
                </ThemeProvider>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <ThemeProvider theme={headerTheme}>
                  {judges.map((value, index) => (<TableCell key={index}>{value}</TableCell>))}
                  <TableCell align='center'>
                    <Fab onClick={handleClickOpenQR} variant="extended" color="primary">
                      <QrCode2Icon sx={{ mr: 1 }} />
                      Подключение
                    </Fab>
                  </TableCell>
                  {judges.map((value, index) => (<TableCell key={index}>{value}</TableCell>))}
                </ThemeProvider>
              </TableRow>
              {rows.map((rowName, rowIndex) => (<TableRow key={rowIndex}>
                {judges.map((_, index) => (<TableCell sx={{ borderBottom: rowIndex === 4 ? "none" : "1px solid grey" }} key={index}>
                  {getScoreElement(0, judges[index], rowIndex).map((value, index) => (<ScoreChip key={index + value} number={value} />))}
                </TableCell>))}
                <TableCell align='center' sx={{ borderBottom: rowIndex === 4 ? "none" : "1px solid grey" }} key={rowIndex}>{rowName}</TableCell>
                {judges.map((_, index) => (<TableCell sx={{ borderBottom: rowIndex === 4 ? "none" : "1px solid grey" }} key={index}>
                  {getScoreElement(1, judges[index], rowIndex).map((value, index) => (<ScoreChip key={index + value} number={value} />))}
                </TableCell>))}
              </TableRow>))}
              <TableRow>
                {columns.slice(0, columns.length / 2).map((value, index) => (<TableCell align='center' key={index}>{value.score}</TableCell>))}
                {judges.length === 0 ? <></> : <TableCell align='center'>Итог</TableCell>}
                {columns.slice(columns.length / 2, columns.length).map((value, index) => (<TableCell align='center' key={index}>{value.score}</TableCell>))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <QRCodeDialog
          open={openQR}
          onClose={handleCloseQR}
        />
        <DisconnectDialog
          open={openD}
          onApprove={handleApprove}
          onClose={handleCloseD}
          judgeName={selectedJudge}
        />
      </div>
    </ThemeProvider>
  );
}

