//TODO: Make participants fetch from server
//TODO: After judge disconnects - delete his scores too (or cache them so he would be able to restore them)

import * as React from "react";
import {
  fetchParticipants,
  fetchScores,
  kickJudge,
  postRoundEnd,
} from "../../api/api";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import styles from "./TablePage.module.css";
import { QRCodeDialog } from "../../Components/QRCodeDialog/QRCodeDialog.component";
import { DisconnectDialog } from "../../Components/DisconnectDialog/DisconnectDialog.component.jsx";
import { ScoreCell } from "../../Components/ScoreCell/ScoreCell.component.jsx";

export const TablePage = () => {
  const [openQR, setOpenQR] = React.useState(false);
  const [openD, setOpenD] = React.useState(false);
  const [selectedJudge, setSelectedJudge] = React.useState("");
  const [judges, setJudges] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  const judgesDictRef = React.useRef({});
  const [participants, setParticipants] = React.useState({
    redName: "",
    blueName: "",
  });
  const [roundActive, setRoundActive] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  const initialScores = {
    blue: {
      judge1: {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
        tiebreak: [],
      },
      judge2: {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
        tiebreak: [],
      },
      judge3: {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
        tiebreak: [],
      },
    },
    red: {
      judge1: {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
        tiebreak: [],
      },
      judge2: {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
        tiebreak: [],
      },
      judge3: {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
        tiebreak: [],
      },
    },
  };
  const [scores, setScores] = React.useState(initialScores);

  const rows = [
    "Удар рукой",
    "Удар ногой",
    "Бросок",
    "Замечания",
    "Предупреждение",
  ];

  const createColumn = (judgeName, participantColor) => {
    return { judgeName, participantColor };
  };

  const getScoreElement = (colorIdx, judgeName, punchIdx) => {
    const colors = ["blue", "red"];
    const punches = ["hand", "leg", "throw", "remark", "warn"];
    const color = colors[colorIdx];
    const judgeKey = judgesDictRef.current[judgeName];
    if (!judgeKey) return [];
    return (
      (scores[color] &&
        scores[color][judgeKey] &&
        scores[color][judgeKey][punches[punchIdx]]) ||
      []
    );
  };

  const setScoreElement = (color, judgeName, punch, scoreValue) => {
    const judgeKey = judgesDictRef.current[judgeName];

    setScores((prev) => {
      const prevColor = prev[color] || {};
      const prevJudge = prevColor[judgeKey] || {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
      };
      const currentArr = prevJudge[punch] || [];

      if (scoreValue === 4) {
        // H modifier: attach to last score in this punch type
        if (currentArr.length === 0) return prev;
        const last = currentArr[currentArr.length - 1];
        if (String(last).endsWith("H")) return prev; // already has H
        const newArr = [...currentArr.slice(0, -1), `${last}H`];
        return {
          ...prev,
          [color]: {
            ...prevColor,
            [judgeKey]: { ...prevJudge, [punch]: newArr },
          },
        };
      }

      return {
        ...prev,
        [color]: {
          ...prevColor,
          [judgeKey]: {
            ...prevJudge,
            [punch]: [...currentArr, evaluateScoreNumber(scoreValue)],
          },
        },
      };
    });
  };

  const removeLastScore = (color, judgeName, punch, score) => {
    const judgeKey = judgesDictRef.current[judgeName];
    if (!judgeKey) return;

    setScores((prev) => {
      const prevColor = prev[color] || {};
      const prevJudge = prevColor[judgeKey] || {
        hand: [],
        leg: [],
        throw: [],
        remark: [],
        warn: [],
      };
      const currentArr = prevJudge[punch] || [];
      if (currentArr.length === 0) return prev;

      let newArr;
      if (score === 4) {
        // Undo Н modifier: strip "H" suffix from the last entry
        const last = currentArr[currentArr.length - 1];
        if (String(last).endsWith("H")) {
          const base = String(last).slice(0, -1);
          const numBase = Number(base);
          newArr = [
            ...currentArr.slice(0, -1),
            isNaN(numBase) ? base : numBase,
          ];
        } else {
          // Last entry doesn't have H, nothing to undo
          return prev;
        }
      } else {
        // Regular undo: remove the last entry
        newArr = currentArr.slice(0, -1);
      }

      return {
        ...prev,
        [color]: {
          ...prevColor,
          [judgeKey]: {
            ...prevJudge,
            [punch]: newArr,
          },
        },
      };
    });
  };

  function evaluateScoreNumber(scoreValue) {
    switch (scoreValue) {
      case 5:
        return "П";
      case 6:
        return "З";
      default:
        return scoreValue;
    }
  }

  function getScoreSum(colorIdx, judgeKey) {
    const colors = ["blue", "red"];
    const regularPunches = ["hand", "leg", "throw", "tiebreak"];
    const judges = ["judge1", "judge2", "judge3"];
    const judgeName = judges[judgeKey];
    const color = colors[colorIdx];
    const enemyColor = colors[colorIdx === 0 ? 1 : 0];
    let sum = 0;
    // Regular scoring
    for (let i = 0; i < regularPunches.length; i++) {
      if (scores[color][judgeName][regularPunches[i]][0]) {
        sum = scores[color][judgeName][regularPunches[i]].reduce(
          (previous, current) => {
            const str = String(current);
            if (str.endsWith("H")) {
              const numPart = parseInt(str, 10);
              return previous + (isNaN(numPart) ? 0 : numPart) + 3;
            }
            if (isNaN(current)) {
              return previous;
            }
            return previous + current;
          },
          sum,
        );
      }
    }
    // Penalty points from opposing side
    const enemyRemarks =
      (scores[enemyColor] &&
        scores[enemyColor][judgeName] &&
        scores[enemyColor][judgeName]["remark"]) ||
      [];
    sum += enemyRemarks.length * 1;
    const enemyWarns =
      (scores[enemyColor] &&
        scores[enemyColor][judgeName] &&
        scores[enemyColor][judgeName]["warn"]) ||
      [];
    sum += enemyWarns.length * 2;
    return sum;
  }

  function calcScore(colorIdx, judgeKey) {
    const enemyColor = colorIdx === 0 ? 1 : 0;
    if (getScoreSum(colorIdx, judgeKey) > getScoreSum(enemyColor, judgeKey)) {
      return 1;
    } else {
      return 0;
    }
  }

  function calcFinalScore(colorIdx) {
    let sumBlue = 0;
    let sumRed = 0;
    for (let i = 0; i < 3; i++) {
      sumBlue += calcScore(0, i);
      sumRed += calcScore(1, i);
    }
    console.log(sumBlue, sumRed);
    if (colorIdx === 0) {
      return sumBlue;
    } else {
      return sumRed;
    }
  }

  React.useEffect(() => {
    fetchAndSetParticipants();
    const ws = new WebSocket(
      `ws://${window.location.host.split(":")[0] + ":8000"}/ws/mainJudge`,
    );
    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };
    ws.onmessage = function (event) {
      let data = JSON.parse(event.data);
      if (data.data === "judgeupd") {
        setJudges(data.judges);
        getJudges(data.judges);
      } else if (data.data === "score") {
        setScoreElement(
          data.score.color,
          data.score.judge,
          data.score.punch,
          data.score.score,
        );
      } else if (data.data === "undo") {
        removeLastScore(
          data.undo.color,
          data.undo.judge,
          data.undo.punch,
          data.undo.score,
        );
      }
    };
    return () => ws.close();
  }, []);

  React.useEffect(() => {
    fillScores();
  }, [judges]);

  async function fetchAndSetParticipants() {
    const responseObj = await fetchParticipants();
    setParticipants({
      blueName: responseObj.blue,
      redName: responseObj.red,
    });
  }

  const getJudges = (judgesArr) => {
    const map = {};
    judgesArr.forEach((name, idx) => {
      map[name] = `judge${idx + 1}`;
    });
    judgesDictRef.current = map;
    loadScoresFromServer(map);
    return map;
  };

  const loadScoresFromServer = async (judgeMap) => {
    try {
      const serverScores = await fetchScores();
      // serverScores: {judgeName: {color: {punch: [values]}}}
      // local format: {color: {judgeKey: {punch: [values]}}}
      const newScores = JSON.parse(JSON.stringify(initialScores));
      for (const [judgeName, colorData] of Object.entries(serverScores)) {
        const judgeKey = judgeMap[judgeName];
        if (!judgeKey) continue;
        for (const [color, punches] of Object.entries(colorData)) {
          if (!newScores[color]) continue;
          newScores[color][judgeKey] = punches;
        }
      }
      setScores(newScores);
    } catch (e) {
      console.error("Failed to load scores from server:", e);
    }
  };

  const fillScores = () => {
    setColumns([]);
    const currentScores = [];
    for (let i = 0; i < judges.length * 2; i++) {
      currentScores.push(
        createColumn(
          judges[i % judges.length],
          i < judges.length - 1 / 2 ? "blue" : "red",
        ),
      );
    }
    setColumns(currentScores);
  };

  const handleClickOpenQR = () => {
    setOpenQR(true);
  };

  const handleCloseQR = () => {
    setOpenQR(false);
  };

  const handleClickOpenD = (judgeIndex) => {
    setSelectedJudge(judges[judgeIndex % (judges.length + 1)]);
    setOpenD(true);
  };

  const handleCloseD = () => {
    setOpenD(false);
  };

  const handleApprove = () => {
    kickJudge(selectedJudge).then((response) => console.log(response));
    console.log(`Disconnected judge ${selectedJudge}`);
  };

  React.useEffect(() => {
    if (!roundActive) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [roundActive]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}м:${s}с`;
  };

  const handleRoundToggle = () => {
    if (roundActive) {
      setRoundActive(false);
      postRoundEnd();
    } else {
      setElapsedSeconds(0);
      setRoundActive(true);
    }
  };

  const hasJudges = judges.length > 0;

  return (
    <div className={styles.container}>
      {/* Header bar with participant names */}
      <div className={styles.headerBar}>
        <div className={`${styles.participantSide} ${styles.blueSide}`}>
          {participants.blueName || "Синий"}
        </div>
        <div className={styles.headerCenter}>Таблица результатов</div>
        <div className={`${styles.participantSide} ${styles.redSide}`}>
          {participants.redName || "Красный"}
        </div>
      </div>

      {/* Main table */}
      <div className={styles.tableWrapper}>
        {!hasJudges ? (
          <div className={styles.emptyState}>
            <QrCode2Icon sx={{ fontSize: 48, color: "#b0bec5" }} />
            <span className={styles.emptyStateText}>
              Нажмите на кнопку, чтобы подключить судей
            </span>
            <button className={styles.connectBtn} onClick={handleClickOpenQR}>
              <QrCode2Icon sx={{ fontSize: 20 }} />
              Подключение
            </button>
          </div>
        ) : (
          <>
            {/* Judge names header */}
            <div className={styles.judgeHeader}>
              {judges.map((name, index) => (
                <div className={styles.judgeCell} key={`blue-${index}`}>
                  <span>{name}</span>
                  <span
                    className={styles.kickBtn}
                    onClick={() => handleClickOpenD(index)}
                  >
                    <HighlightOffIcon sx={{ fontSize: 18 }} />
                  </span>
                </div>
              ))}
              <div className={styles.centerCell}>
                <div className={styles.roundControls}>
                  <span
                    className={`${styles.timerDisplay} ${roundActive ? styles.timerActive : ""}`}
                  >
                    {formatTime(elapsedSeconds)}
                  </span>
                  <button
                    className={styles.connectBtn}
                    onClick={handleClickOpenQR}
                  >
                    <QrCode2Icon sx={{ fontSize: 18 }} />
                    QR
                  </button>
                  <button
                    className={`${styles.roundBtn} ${roundActive ? styles.roundBtnEnd : styles.roundBtnStart}`}
                    onClick={handleRoundToggle}
                  >
                    {roundActive ? "Завершить раунд" : "Начать раунд"}
                  </button>
                </div>
              </div>
              {judges.map((name, index) => (
                <div className={styles.judgeCell} key={`red-${index}`}>
                  <span>{name}</span>
                  <span
                    className={styles.kickBtn}
                    onClick={() => handleClickOpenD(index)}
                  >
                    <HighlightOffIcon sx={{ fontSize: 18 }} />
                  </span>
                </div>
              ))}
            </div>

            {/* Score rows */}
            <div className={styles.scoreArea}>
              {rows.map((rowName, rowIndex) => (
                <div className={styles.scoreRow} key={rowIndex}>
                  {judges.map((_, index) => (
                    <div
                      className={`${styles.scoreCell} ${styles.blueTint}`}
                      key={`blue-${index}`}
                    >
                      <ScoreCell>
                        {getScoreElement(0, judges[index], rowIndex)}
                      </ScoreCell>
                    </div>
                  ))}
                  <div className={styles.rowLabel}>{rowName}</div>
                  {judges.map((_, index) => (
                    <div
                      className={`${styles.scoreCell} ${styles.redTint}`}
                      key={`red-${index}`}
                    >
                      <ScoreCell>
                        {getScoreElement(1, judges[index], rowIndex)}
                      </ScoreCell>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Sum row */}
            <div className={styles.footerRow}>
              {columns.slice(0, columns.length / 2).map((_, index) => (
                <div className={styles.footerCell} key={`blue-sum-${index}`}>
                  {getScoreSum(0, index)}
                </div>
              ))}
              <div className={styles.footerLabel}>Сумма</div>
              {columns
                .slice(columns.length / 2, columns.length)
                .map((_, index) => (
                  <div className={styles.footerCell} key={`red-sum-${index}`}>
                    {getScoreSum(1, index)}
                  </div>
                ))}
            </div>

            {/* Score row */}
            <div
              className={styles.footerRow}
              style={{ borderTop: "1px solid #e0e0e0" }}
            >
              {columns.slice(0, columns.length / 2).map((_, index) => (
                <div className={styles.footerCell} key={`blue-score-${index}`}>
                  {calcScore(0, index)}
                </div>
              ))}
              <div className={styles.footerLabel}>Счёт</div>
              {columns
                .slice(columns.length / 2, columns.length)
                .map((_, index) => (
                  <div className={styles.footerCell} key={`red-score-${index}`}>
                    {calcScore(1, index)}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* Final score */}
      {hasJudges && (
        <div className={styles.finalScore}>
          <div className={`${styles.scoreBox} ${styles.scoreBoxBlue}`}>
            {calcFinalScore(0)}
          </div>
          <span className={styles.scoreDivider}>:</span>
          <div className={`${styles.scoreBox} ${styles.scoreBoxRed}`}>
            {calcFinalScore(1)}
          </div>
        </div>
      )}

      <QRCodeDialog open={openQR} onClose={handleCloseQR} />
      <DisconnectDialog
        open={openD}
        onApprove={handleApprove}
        onClose={handleCloseD}
        judgeName={selectedJudge}
      />
    </div>
  );
};
