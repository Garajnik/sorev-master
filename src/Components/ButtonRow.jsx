import PropTypes from "prop-types";
import "./ButtonRow.css";

const ButtonRow = ({
  rowIndex,
  title,
  buttonCount = 4,
  buttonClass = "button",
  onButtonClick,
  buttonClicks,
}) => {
  const renderButtons = (keyPrefix, additionalClass) => {
    const buttons = Array.from({ length: buttonCount }, (_, index) => {
      const isLastButton = index === buttonCount - 1 && buttonCount > 1;
      const displayIndex = isLastButton ? 100 : index + 1;

      return (
        <div key={`${keyPrefix}-${index}`} className="button-container">
          {additionalClass === "right-button" ? (
            <>
              <span className="click-count">
                {buttonClicks[`${rowIndex}-${index}-${additionalClass}`] || 0}
              </span>
              <button
                className={`${buttonClass} ${additionalClass} ${
                  isLastButton ? "last-button" : ""
                }`}
                onClick={() =>
                  onButtonClick(index, rowIndex, buttonCount * 2 - index - 1)
                }
              >
                {buttonClass === "button"
                  ? isLastButton
                    ? "Н"
                    : displayIndex
                  : "Предупреждение"}
              </button>
            </>
          ) : (
            <>
              <button
                className={`${buttonClass} ${additionalClass} ${
                  isLastButton ? "last-button" : ""
                }`}
                onClick={() => onButtonClick(index, rowIndex, index)}
              >
                {buttonClass === "button"
                  ? isLastButton
                    ? "Н"
                    : displayIndex
                  : "Предупреждение"}
              </button>
              <span className="click-count">
                {buttonClicks[`${rowIndex}-${index}-${additionalClass}`] || 0}
              </span>
            </>
          )}
        </div>
      );
    });
    // Если класс 'right-button', инвертируем порядок кнопок
    return additionalClass === "right-button" ? buttons.reverse() : buttons;
  };

  return (
    <div className="button-row">
      <div className="left">
        {renderButtons(`row-${rowIndex}`, "left-button")}
      </div>
      <div className="center">{title}</div>
      <div className="right">
        {renderButtons(`row-${rowIndex}`, "right-button")}
      </div>
    </div>
  );
};

ButtonRow.propTypes = {
  rowIndex: PropTypes.number.isRequired,
  colIndex: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  buttonCount: PropTypes.number,
  buttonClass: PropTypes.string,
  onButtonClick: PropTypes.func.isRequired,
  buttonClicks: PropTypes.object.isRequired,
};

export default ButtonRow;
