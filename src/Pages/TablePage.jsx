import { useState, useEffect } from "react";
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
    ["", "", "", "0", "Удар рукой", "0", "", "", ""],
    ["", "", "", "0", "Удар ногой", "0", "", "", ""],
    ["", "", "", "0", "Бросок", "0", "", "", ""],
    ["", "", "", "0", "Предупреждение", "0", "", "", ""],
    ["", "", "", "0", "Итог", "0", "", "", ""],
  ];

  const [tableData, setTableData] = useState(initialTableData);

  const updateTableCell = (row, col, value, judgeName) => {
    let newValue = value;
    if (row === 2) {
      if (value >= 3) {
        newValue = "Н";
      }
    } else if (row === 4) {
      newValue = "П";
    } else {
      if (value >= 4) {
        newValue = "Н";
        console.log("Новое значение установлено");
      }
    }
    setTableData((prevTableData) => {
      const updatedTableData = [...prevTableData];
      //Установка значений для среднего ряда
      if (row === 2) {
        if (col > 3) {
          for (let i = 4; i < 9; i++) {
            if (updatedTableData[0][i] === judgeName) {
              updatedTableData[row][i] = newValue;
              console.log(newValue);
            }
          }
        } else {
          for (let i = 0; i < 4; i++) {
            if (updatedTableData[0][i] === judgeName) {
              updatedTableData[row][i] = newValue;
            }
          }
        }
        //Установка предупреждений
      } else if (row === 4) {
        if (col > 1) {
          for (let i = 5; i < 9; i++) {
            if (updatedTableData[0][i] === judgeName) {
              updatedTableData[row][i] = newValue;
            }
          }
        } else {
          for (let i = 0; i < 5; i++) {
            if (updatedTableData[0][i] === judgeName) {
              updatedTableData[row][i] = newValue;
            }
          }
        }
        return updatedTableData;
        //Установка значений для всех остальных рядов
      } else {
        if (col > 4) {
          for (let i = 5; i < 9; i++) {
            if (updatedTableData[0][i] === judgeName) {
              updatedTableData[row][i] = newValue;
            }
          }
        } else {
          for (let i = 0; i < 5; i++) {
            if (updatedTableData[0][i] === judgeName) {
              updatedTableData[row][i] = newValue;
            }
          }
        }
      }
      return updatedTableData;
    });
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
    socket.on("update_judges", (data) => {
      const { judge_name } = data;
      console.log("Received update_judges:", judge_name);

      setJudges((prevJudgeNames) => {
        for (let i = 0; i < prevJudgeNames.length; i++) {
          if (prevJudgeNames[i] === "") {
            const newJudgeNames = [
              ...prevJudgeNames.slice(0, i),
              judge_name,
              ...prevJudgeNames.slice(i + 1),
            ];
            console.log("Судья установлен, новые судьи: ", newJudgeNames);
            return newJudgeNames;
          }
        }
        return prevJudgeNames;
      });
    });

    socket.on("update_table", (data) => {
      console.log("Received update_table:", data);
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
          {tableData.map((row, rowIndex) => (
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
      <button onClick={handleNewRound} className="end-round-button">
        Завершить поединок
      </button>
    </div>
  );
};

export default TablePage;
