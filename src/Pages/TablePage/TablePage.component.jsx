//TODO: Create start/end round button
//TODO: Make participants fetch from server
//TODO: After judge disconnects - delete his scores too (or cache them so he would be able to restore them)

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
import { ScoreCell } from '../../Components/ScoreCell/ScoreCell.component.jsx';
import { Typography } from '@mui/material';

export const TablePage = () => {
  const [openQR, setOpenQR] = React.useState(false);
  const [openD, setOpenD] = React.useState(false);
  const [selectedJudge, setSelectedJudge] = React.useState("")
  const [judges, setJudges] = React.useState([])
  const [columns, setColumns] = React.useState([])
  const [_, setJudgesDict] = React.useState({});
  const judgesDictRef = React.useRef({});
  const [participants, setParticipants] = React.useState({
    redName: "",
    blueName: ""
  })
  const [scoreSums, setScoreSums] = React.useState(0);

  const initialScores = {
    "blue": {
      "judge1": {
        "hand": [],
        "leg": [],
        "throw": [],
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
    },
    "red": {
      "judge1": {
        "hand": [],
        "leg": [],
        "throw": [],
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
  const [scores, setScores] = React.useState(initialScores);

  const rows = judges.length === 0 ? ["Нажмите на кнопку, чтобы подключить судей"] : [
    "Удар рукой", "Удар ногой", "Бросок", "Предупреждение"
  ]

  const createColumn = (judgeName, participantColor) => {
    return { judgeName, participantColor }
  }

  const getScoreElement = (colorIdx, judgeName, punchIdx) => {
    const colors = ['blue', 'red'];
    const punches = ['hand', 'leg', 'throw', 'warn'];
    const color = colors[colorIdx];
    const judgeKey = judgesDictRef.current[judgeName];
    if (!judgeKey) return [];
    return (scores[color] && scores[color][judgeKey] && scores[color][judgeKey][punches[punchIdx]]) || [];
  }

  const setScoreElement = (color, judgeName, punch, scoreValue) => {
    const judgeKey = judgesDictRef.current[judgeName];

    setScores(prev => {
      const prevColor = prev[color] || {};
      const prevJudge = prevColor[judgeKey] || { hand: [], leg: [], throw: [], warn: [] };

      return {
        ...prev,
        [color]: {
          ...prevColor,
          [judgeKey]: {
            ...prevJudge,
            [punch]: [...(prevJudge[punch] || []), evaluateScoreNumber(scoreValue)]
          }
        }
      };
    });
  }

  function evaluateScoreNumber(scoreValue) {
    switch (scoreValue) {
      case 4:
        return "H"
      case 5:
        return "П"
      default:
        return scoreValue;
    }
  }

  function getScoreSum(colorIdx, judgeKey) {
    const colors = ['blue', 'red'];
    const punches = ['hand', 'leg', 'throw', 'warn'];
    const judges = ['judge1', 'judge2', 'judge3'];
    const judgeName = judges[judgeKey]
    const color = colors[colorIdx];
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      if (scores[color][judgeName][punches[i]][0]) {
        sum = scores[color][judgeName][punches[i]].reduce((previous, current) => {
          if (current === "H") {
            return previous + 3;
          }
          if (isNaN(current)) {
            return previous;
          }
          return previous + current;
        }, sum)
      }
    }
    return sum
  }

  function calcScore(colorIdx, judgeKey) {
    const colors = ['blue', 'red'];
    const color = colors[colorIdx];
    const enemyColor = colorIdx === 0 ? 1 : 0
    if (getScoreSum(colorIdx, judgeKey) > getScoreSum(enemyColor, judgeKey)) {
      return 1;
    }
    else {
      return 0;
    }
  }

  function calcFinalScore(colorIdx) {
    let sumBlue = 0;
    let sumRed = 0;
    for (let i = 0; i < 3; i++) {
      sumBlue += calcScore(0, i)
      sumRed += calcScore(1, i)
    }
    console.log(sumBlue, sumRed)
    if (colorIdx === 0) {
      return sumBlue
    }
    else {
      return sumRed;
    }
  }

  React.useEffect(() => {
    fetchParticipants()
    // console.log(participants)
    const ws = new WebSocket(`ws://${window.location.host.split(":")[0] + ":8000"}/ws/mainJudge`);
    ws.onopen = () => { console.log("Connected to WebSocket") }
    ws.onmessage = function (event) {
      let data = JSON.parse(event.data)
      // Checking if we`re receiving either score or connection
      if (data.data === "judgeupd") {
        setJudges(data.judges)
        getJudges(data.judges)
      }
      else if (data.data === "score") {
        // console.log(data.score)
        setScoreElement(data.score.color, data.score.judge, data.score.punch, data.score.score)
      }
    }
    // const request = new Request(`http://${window.location.host.split(":")[0] + ":8000"}/get_participants`)
    // fetch(request).then(response => JSON.parse(response).then(text => console.log(text)))
    return () =>
      ws.close()

  }, [])

  React.useEffect(() => {
    fillScores()
  }, [judges])

  async function fetchParticipants() {
    fetch(`http://${window.location.host.split(":")[0] + ":8000"}/participants`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      },
    )
      .then(response => response.json())
      .then(response => {
        const responseObj = JSON.parse(response)
        setParticipants({
          blueName: responseObj.blue,
          redName: responseObj.red
        })
      })
  }

  const getJudges = (judgesArr) => {
    const map = {};
    judgesArr.forEach((name, idx) => { map[name] = `judge${idx + 1}` });
    setJudgesDict(map);
    judgesDictRef.current = map;
    return map;
  }

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
            width: "min-content",
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
          <Typography variant='h4'>Таблица результатов</Typography>
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
                  <ScoreCell>{getScoreElement(0, judges[index], rowIndex)}</ScoreCell>
                </TableCell>))}
                <TableCell align='center' sx={{ borderBottom: rowIndex === 4 ? "none" : "1px solid grey" }} key={rowIndex}>{rowName}</TableCell>
                {judges.map((_, index) => (<TableCell sx={{ borderBottom: rowIndex === 4 ? "none" : "1px solid grey" }} key={index}>
                  {getScoreElement(1, judges[index], rowIndex).map((value, index) => (<ScoreChip key={index + value} number={value} />))}
                </TableCell>))}
              </TableRow>))}
              <TableRow>
                {columns.slice(0, columns.length / 2).map((value, index) => (<TableCell sx={{ borderBottom: "1px solid grey" }} align='center' key={index}>{getScoreSum(0, index)}</TableCell>))}
                {judges.length === 0 ? <></> : <TableCell sx={{ borderBottom: "1px solid grey" }} align='center'>Сумма очков</TableCell>}
                {columns.slice(columns.length / 2, columns.length).map((value, index) => (<TableCell sx={{ borderBottom: "1px solid grey" }} align='center' key={index}>{getScoreSum(1, index)}</TableCell>))}
              </TableRow>
              <TableRow>
                {columns.slice(0, columns.length / 2).map((value, index) => (<TableCell align='center' key={index}>{calcScore(0, index)}</TableCell>))}
                {judges.length === 0 ? <></> : <TableCell align='center'>Счёт</TableCell>}
                {columns.slice(columns.length / 2, columns.length).map((value, index) => (<TableCell align='center' key={index}>{calcScore(1, index)}</TableCell>))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
          <Typography variant='h2'>{calcFinalScore(0)}</Typography>
          <Typography variant='h2'>:</Typography>
          <Typography variant='h2'>{calcFinalScore(1)}</Typography>
        </div>
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

