import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./NewJudge.css";

const NewJudge = () => {
  const [judgeName, setJudgeName] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setJudgeName(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        `http://${
          window.location.host.split(":")[0] + ":5000"
        }/submit_judge_name`,
        {
          judge_name: judgeName,
        }
      );
      if (response.status === 200) {
        navigate("/mobile", { state: { judgeName } });
      }
    } catch (error) {
      console.error("Error sending judge name to server", error);
    }
  };

  return (
    <div className="new-judge-container">
      <input
        type="text"
        placeholder="Введите имя судьи"
        value={judgeName}
        onChange={handleInputChange}
        className="judge-input"
      />
      <button
        onClick={handleSubmit}
        disabled={!judgeName}
        className="start-button"
      >
        Начать
      </button>
    </div>
  );
};

export default NewJudge;
