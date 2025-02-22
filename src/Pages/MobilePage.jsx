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

  // Отключаем прокрутку
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Получаем имена с сервера
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

  // Вращаем экран сразу
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Attempt to lock the screen orientation to landscape
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        } else {
          console.warn(
            "Screen Orientation API is not supported in this browser."
          );
        }
      } catch (error) {
        console.error("Orientation lock failed:", error);
      }
    };

    lockOrientation();

    // Unlock the orientation when the component is unmounted
    return () => {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  const handleButtonClick = async (
    index,
    rowIndex,
    colIndex,
    additionalClass
  ) => {
    const postData = {
      "judge-name": judgeName,
      "button-index": index + 1,
      "button-column": colIndex + 1,
      "button-row": rowIndex + 1,
    };

    navigator.vibrate(100);

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
      [`${rowIndex}-${index}-${additionalClass}`]:
        (prevClicks[`${rowIndex}-${index}-${additionalClass}`] || 0) + 1,
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
        buttonCount={3}
        onButtonClick={handleButtonClick}
        buttonClicks={buttonClicks}
      />
      <hr className="divider" />
      <ButtonRow
        rowIndex={1}
        title="Удар ногой"
        buttonCount={4}
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
