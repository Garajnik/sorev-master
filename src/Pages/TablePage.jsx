import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./TablePage.css"; // Импорт CSS файла
import QRCode from "qrcode.react";
import { useNavigate } from "react-router-dom";

const TablePage = () => {
  let redName = "Имя Красного Участника";
  let blueName = "Имя Синего Участника";
  const [judgeNames, setJudges] = useState(["", "", ""]);
  const [names, setNames] = useState({ redName, blueName });
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  let [isRunning] = useState(false);
  let [timerRow, setTimerRow] = useState(0);

  const timerRef = useRef(null);

  const [endRoundText, setEndRoundText] = useState("");
  const [showNewButton, setShowNewButton] = useState(false);

  const initialTableData = [
    [
      `${judgeNames[0]}`,
      `${judgeNames[1]}`,
      `${judgeNames[2]}`,
      "Итог",
      "",
      "Итог",
      `${judgeNames[0]}`,
      `${judgeNames[1]}`,
      `${judgeNames[2]}`,
    ],
    ["", "", "", "", "Удар рукой", "", "", "", ""],
    ["", "", "", "", "Удар ногой", "", "", "", ""],
    ["", "", "", "", "Бросок", "", "", "", ""],
    ["", "", "", "", "Предупреждение", "", "", "", ""],
    ["", "", "", "0", "Итог", "0", "", "", ""],
  ];

  const [tableData, setTableData] = useState(initialTableData);

  const [newTableData, setNewTableData] = useState([
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
  ]);

  const mergeTableData = (existingData, newData) => {
    return existingData.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        const newValue = newData[rowIndex]?.[colIndex];
        return newValue ? `${cell} (${newValue})` : cell;
      });
    });
  };

  const mergedTableData = mergeTableData(tableData, newTableData);

  const startTimer = (updatedTableData, row) => {
    if (!isRunning) {
      timerRow = row;
      isRunning = true;
      console.log("Таймер начался на ряду: " + timerRow);
      timerRef.current = setTimeout(() => {
        console.log("Таймер завершился на ряду: " + timerRow);
        //Считаем итоги в последней строке
        calculateRowTotalForRow(updatedTableData, row);
        //Очищаем старые значения
        clearRowByIndex(row);
        isRunning = false;
      }, 3000);
    } else if (row != timerRow) {
      console.log("Запускаем дополнительный таймер");
      timerRow = row;
      isRunning = true;
      console.log("Таймер начался на ряду: " + timerRow);
      timerRef.current = setTimeout(() => {
        console.log("Таймер завершился на ряду: " + timerRow);
        //Считаем итоги в последней строке
        calculateRowTotalForRow(updatedTableData, row);
        //Очищаем старые значения
        clearRowByIndex(row);
        isRunning = false;
      }, 3000);
    }
  };

  const checkResult = (counts) => {
    if (counts[0] >= 2) {
      endRound("Нокдаун, победил красный");
    }
    if (counts[1] >= 2) {
      endRound("Нокдаун, победил синий");
    }
    if (counts[2] >= 3) {
      endRound("Предупреждение, победил красный");
    }
    if (counts[3] >= 3) {
      endRound("Предупреждение, победил синий");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const clearRowByIndex = (rowIndex) => {
    setTableData((prevTableData) => {
      return prevTableData.map((row, index) => {
        if (index === rowIndex) {
          return row.map((cell, cellIndex) => {
            if (cellIndex < 3 || cellIndex >= row.length - 3) {
              return ""; // Заменяем значение на пустую строку
            }
            return cell; // Оставляем значение без изменений
          });
        }
        return row; // Оставляем строку без изменений, если это не целевая строка
      });
    });
  };

  const findMostFrequentOrLargestNumber = (arr) => {
    const filledArr = arr.filter(
      (num) => num !== "" && num !== null && num !== undefined
    );

    const hasP = filledArr.includes("П");

    if (hasP && !filledArr.every((num) => num === "П")) {
      return null;
    }

    if (filledArr.length < 2) {
      return null;
    }

    const frequencyMap = filledArr.reduce((acc, num) => {
      acc[num] = (acc[num] || 0) + 1;
      return acc;
    }, {});

    let mostFrequentNumber = null;
    let maxFrequency = 0;
    let largestNumber = null;

    for (const num in frequencyMap) {
      if (frequencyMap[num] > maxFrequency) {
        mostFrequentNumber = num;
        maxFrequency = frequencyMap[num];
      }
      if (
        largestNumber === null ||
        parseInt(num, 10) > parseInt(largestNumber, 10)
      ) {
        largestNumber = num;
      }
    }

    return maxFrequency > 1 ? mostFrequentNumber : largestNumber;
  };

  const calculateRowTotalForRow = (data, rowIndex) => {
    if (rowIndex === 0 || rowIndex === 5) return;

    const row = data[rowIndex];
    const rowTotalRed = findMostFrequentOrLargestNumber(row.slice(0, 3));
    const rowTotalBlue = findMostFrequentOrLargestNumber(row.slice(6, 9));

    const updatedRow = [...row];

    if (rowTotalRed === "П") {
      updatedRow[5] = updatedRow[5] ? `${updatedRow[5]}, 2` : "2";
      updatedRow[3] = updatedRow[3] ? `${updatedRow[3]}, П` : "П";
    } else if (rowTotalRed !== null) {
      updatedRow[3] = updatedRow[3]
        ? `${updatedRow[3]}, ${rowTotalRed}`
        : rowTotalRed;
    }

    if (rowTotalBlue === "П") {
      updatedRow[5] = updatedRow[5] ? `${updatedRow[5]}, П` : "П";
      updatedRow[3] = updatedRow[3] ? `${updatedRow[3]}, 2` : "2";
    } else if (rowTotalBlue !== null) {
      updatedRow[5] = updatedRow[5]
        ? `${updatedRow[5]}, ${rowTotalBlue}`
        : rowTotalBlue;
    }

    // Update newTableData with old values from the current row
    setNewTableData((prevNewTableData) => {
      return prevNewTableData.map((newRow, newIndex) => {
        if (newIndex === rowIndex) {
          return newRow.map((newCell, newCellIndex) => {
            if (newCellIndex < 3 || newCellIndex >= newRow.length - 3) {
              return newCell
                ? `${newCell}, ${row[newCellIndex]}`
                : row[newCellIndex];
            }
            return newCell; // Leave other columns unchanged
          });
        }
        return newRow; // Leave other rows unchanged
      });
    });
    console.log("Считаем");

    setTableData((prevTableData) => {
      const newTableData = [...prevTableData];
      newTableData[rowIndex] = updatedRow;
      calculateFinalTotals(newTableData);
      countHNInColumns(newTableData);
      return newTableData;
    });
  };

  const calculateFinalTotals = (data) => {
    const sumCellValues = (cell) => {
      return cell
        ? cell.split(",").reduce((acc, value) => {
            if (value.trim() === "Н") {
              return acc + 3;
            } else {
              return acc + (parseInt(value, 10) || 0);
            }
          }, 0)
        : 0;
    };

    const finalRedTotal = data
      .slice(1, 5)
      .reduce((acc, row) => acc + sumCellValues(row[3]), 0);
    const finalBlueTotal = data
      .slice(1, 5)
      .reduce((acc, row) => acc + sumCellValues(row[5]), 0);

    setTableData((prevTableData) => {
      const newTableData = [...prevTableData];
      newTableData[5][3] = finalRedTotal;
      newTableData[5][5] = finalBlueTotal;
      return newTableData;
    });
  };

  const updateTableCell = (row, col, value, judgeName) => {
    let newValue = value;
    if (row === 1) {
      if (value >= 3) {
        newValue = "Н";
      }
    } else if (row === 4) {
      newValue = "П";
    } else {
      if (value >= 4) {
        newValue = "Н";
        //console.log("Новое значение установлено");
      }
    }

    setTableData((prevTableData) => {
      const updatedTableData = [...prevTableData];

      const updateCell = (i) => {
        if (updatedTableData[0][i] === judgeName) {
          const currentValue = updatedTableData[row][i];
          if (newValue === "Н") {
            // Если текущее значение является числом, добавляем "Н" через запятую
            if (
              currentValue !== null &&
              currentValue !== "" &&
              !isNaN(currentValue)
            ) {
              updatedTableData[row][i] = `${currentValue}, Н`;
            }
            // Иначе не изменяем значение
          } else {
            updatedTableData[row][i] = newValue;
          }
        }
      };

      if (row === 1) {
        if (col > 3) {
          for (let i = 4; i < 9; i++) {
            updateCell(i);
          }
        } else {
          for (let i = 0; i < 4; i++) {
            updateCell(i);
          }
        }
      } else if (row === 4) {
        if (col > 1) {
          for (let i = 5; i < 9; i++) {
            updateCell(i);
          }
        } else {
          for (let i = 0; i < 5; i++) {
            updateCell(i);
          }
        }
      } else {
        if (col > 4) {
          for (let i = 5; i < 9; i++) {
            updateCell(i);
          }
        } else {
          for (let i = 0; i < 5; i++) {
            updateCell(i);
          }
        }
      }
      startTimer(updatedTableData, row);
      return updatedTableData;
    });
  };

  // Функция для подсчета количества "Н" и "П" в определённых столбцах, начиная со второй строки
  const countHNInColumns = (arr) => {
    //console.log(arr);
    const counts = [0, 0, 0, 0]; // [countHInCol4, countHInCol6, countPInCol4, countPInCol6]

    for (let i = 1; i < arr.length; i++) {
      const row = arr[i];
      const col4Elements = typeof row[3] === "string" ? row[3].split(",") : [];
      const col6Elements = typeof row[5] === "string" ? row[5].split(",") : [];

      col4Elements.forEach((element) => {
        //console.log(element);
        const trimmedElement = element.trim();
        if (trimmedElement === "Н") {
          counts[0]++;
        }
        if (trimmedElement === "П") {
          counts[2]++;
        }
      });

      col6Elements.forEach((element) => {
        const trimmedElement = element.trim();
        if (trimmedElement === "Н") {
          counts[1]++;
        }
        if (trimmedElement === "П") {
          counts[3]++;
        }
      });
    }

    checkResult(counts);
    //console.log("Counts: " + counts);
  };

  useEffect(() => {
    const socket = io(`http://${window.location.host.split(":")[0] + ":5000"}`); // Замените на ваш адрес сервера

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("update_names", (data) => {
      setNames({
        redName: data.redName,
        blueName: data.blueName,
      });
    });

    socket.emit("request_judges");

    socket.on("update_judges", (data) => {
      const { connected_judges } = data;
      //console.log("Received update_judges:", connected_judges);

      setJudges((prevJudgeNames) => {
        // Create a new set from previous judge names to efficiently check for duplicates
        const judgeSet = new Set(prevJudgeNames);

        // Create a new array to hold updated judge names
        const newJudgeNames = [...prevJudgeNames];

        // Fill in the empty slots with the received judge names if they are not duplicates
        for (let judge_name of connected_judges) {
          if (!judgeSet.has(judge_name)) {
            judgeSet.add(judge_name);
            let added = false;
            for (let i = 0; i < newJudgeNames.length; i++) {
              if (newJudgeNames[i] === "") {
                newJudgeNames[i] = judge_name;
                added = true;
                break;
              }
            }
            // If there were no empty slots, append the judge name
            if (!added) {
              newJudgeNames.push(judge_name);
            }
          }
        }

        //console.log("Updated judges:", newJudgeNames);
        return newJudgeNames;
      });
    });

    socket.on("update_table", (data) => {
      //console.log("Received update_table:", data);
      const { button_row, button_column, button_index, judge_name } = data;
      const value = `${button_index}`;
      updateTableCell(button_row, button_column, value, judge_name);
    });

    fetchLocalIp();

    return () => {
      socket.disconnect();
    };
  }, []);

  //Тут обновление имён судей
  useEffect(() => {
    setTableData((prevTableData) => {
      const updatedTableData = [...prevTableData];
      updatedTableData[0][0] = judgeNames[0];
      updatedTableData[0][1] = judgeNames[1];
      updatedTableData[0][2] = judgeNames[2];
      updatedTableData[0][6] = judgeNames[0];
      updatedTableData[0][7] = judgeNames[1];
      updatedTableData[0][8] = judgeNames[2];
      return updatedTableData;
    });
  }, [judgeNames]);

  const fetchLocalIp = async () => {
    try {
      const response = await fetch(
        `http://${window.location.host.split(":")[0] + ":5000"}/local_ip`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const localIp = data.local_ip;
      setQrCodeUrl(`http://${localIp}:5000/newjudge`);
    } catch (error) {
      console.error("Failed to fetch local IP:", error);
    }
  };

  // Устанавливаем текст для завершения поединка
  const endRound = (text) => {
    setEndRoundText(`Поединок завершён. ${text}`);
    setShowNewButton(true);
  };

  const navigate = useNavigate();

  const handleNewRound = () => {
    if (window.confirm("Вы уверены, что хотите начать новый раунд?")) {
      navigate("/");
    }
  };
  return (
    <div className="table-container">
      <div className="qr-code">
        {qrCodeUrl ? (
          <>
            <QRCode value={qrCodeUrl} size={128} />
            <p>Отсканируйте для доступа на мобильном устройстве</p>
          </>
        ) : (
          <p>Загрузка QR-кода...</p>
        )}
      </div>
      <div className="table-page-container">
        <div className="table-names-container">
          <h1 className="table-red-name">{names.redName}</h1>
          <h1 className="table-blue-name">{names.blueName}</h1>
        </div>
      </div>
      <table>
        <tbody>
          {mergedTableData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={colIndex < 3 ? "red" : colIndex > 5 ? "blue" : ""}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {!showNewButton ? (
          <button onClick={() => endRound("")} className="end-round-button">
            Завершить раунд
          </button>
        ) : (
          <button onClick={handleNewRound} className="end-round-button">
            Начать новый поединок
          </button>
        )}
      </div>
      <h1>{endRoundText}</h1>
    </div>
  );
};

export default TablePage;
