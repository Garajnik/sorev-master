import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import ButtonRow from "../Components/ButtonRow";
import { useLocation } from "react-router-dom";
import "./MobilePage.css";
import { io } from "socket.io-client";
import axios from "axios";

const MobilePage = ({
  redName = "Имя Красного Участника",
  blueName = "Имя Синего Участника",
}) => {
  const location = useLocation();
  const judgeName = location.state?.judgeName || "Судья 1";

  const [buttonClicks, setButtonClicks] = useState({});
  const [names, setNames] = useState({ redName, blueName });

  //Отключаем прокрутку
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  //Получаем имена с сервера
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await axios.get(
          `http://${
            window.location.host.split(":")[0] + ":5000"
          }/participant_names`
        );
        const data = response.data;
        setNames({
          redName: data.redName,
          blueName: data.blueName,
        });
      } catch (error) {
        console.error("Error fetching participant names:", error);
      }
    };

    fetchNames();

    const socket = io(`http://${window.location.host.split(":")[0] + ":5000"}`);

    socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    socket.on("update_names", (data) => {
      setNames({
        redName: data.redName,
        blueName: data.blueName,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleButtonClick = async (index, rowIndex, colIndex) => {
    const postData = {
      "judge-name": judgeName,
      "button-index": index + 1,
      "button-column": colIndex + 1,
      "button-row": rowIndex + 1,
    };

    try {
      await axios.post(
        `http://${
          window.location.host.split(":")[0] + ":5000"
        }/handle_button_click`,
        postData
      );
      console.log("Data sent successfully:", postData);
    } catch (error) {
      console.error("Error sending data:", error);
    }

    setButtonClicks((prevClicks) => ({
      ...prevClicks,
      [`${rowIndex}-${index}-left-button`]: prevClicks[
        `${rowIndex}-${index}-left-button`
      ]
        ? prevClicks[`${rowIndex}-${index}-left-button`] + 1
        : 1,
      [`${rowIndex}-${index}-right-button`]: prevClicks[
        `${rowIndex}-${index}-right-button`
      ]
        ? prevClicks[`${rowIndex}-${index}-right-button`] + 1
        : 1,
    }));
  };

  return (
    <div className="page-container">
      <div className="names-container">
        <h1 className="red-name">{names.redName}</h1>
        <h1 className="judge-name">{judgeName}</h1>
        <h1 className="blue-name">{names.blueName}</h1>
      </div>
      <hr className="divider" />
      <ButtonRow
        rowIndex={0}
        title="Удар рукой"
        onButtonClick={handleButtonClick}
        buttonClicks={buttonClicks}
      />
      <hr className="divider" />
      <ButtonRow
        rowIndex={1}
        title="Удар ногой"
        buttonCount={3}
        onButtonClick={handleButtonClick}
        buttonClicks={buttonClicks}
      />
      <hr className="divider" />
      <ButtonRow
        rowIndex={2}
        title="Бросок"
        onButtonClick={handleButtonClick}
        buttonClicks={buttonClicks}
      />
      <hr className="divider" />
      <ButtonRow
        rowIndex={3}
        title=""
        buttonCount={1}
        buttonClass="button-pred"
        onButtonClick={handleButtonClick}
        buttonClicks={buttonClicks}
      />
    </div>
  );
};

MobilePage.propTypes = {
  redName: PropTypes.string,
  blueName: PropTypes.string,
};

export default MobilePage;
