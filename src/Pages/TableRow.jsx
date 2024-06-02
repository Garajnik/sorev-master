import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const TableRow = ({ rowIndex, row, updateRowTotals }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [updatedRow, setUpdatedRow] = useState(row);
  const timerRef = useRef(null);

  const findMostFrequentOrLargestNumber = (arr) => {
    const frequencyMap = arr.reduce((acc, num) => {
      if (num !== "" && num !== null && num !== undefined) {
        acc[num] = (acc[num] || 0) + 1;
      }
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

  const calculateRowTotals = () => {
    const rowTotalRed = findMostFrequentOrLargestNumber(updatedRow.slice(0, 3));
    const rowTotalBlue = findMostFrequentOrLargestNumber(
      updatedRow.slice(6, 9)
    );

    const newRow = [...updatedRow];
    if (rowTotalRed === "П") {
      newRow[5] = newRow[5] ? `${newRow[5]}, 2` : "2";
    } else {
      newRow[3] =
        rowTotalRed !== null
          ? newRow[3]
            ? `${newRow[3]}, ${rowTotalRed}`
            : rowTotalRed
          : newRow[3];
    }

    if (rowTotalBlue === "П") {
      newRow[3] = newRow[3] ? `${newRow[3]}, 2` : "2";
    } else {
      newRow[5] =
        rowTotalBlue !== null
          ? newRow[5]
            ? `${newRow[5]}, ${rowTotalBlue}`
            : rowTotalBlue
          : newRow[5];
    }

    setUpdatedRow(newRow);
    updateRowTotals(rowIndex, newRow);
  };

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      timerRef.current = setTimeout(() => {
        calculateRowTotals();
        setIsRunning(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    startTimer();
  }, [row]);

  return (
    <tr>
      {updatedRow.map((cell, colIndex) => (
        <td
          key={colIndex}
          className={colIndex < 3 ? "red" : colIndex > 5 ? "blue" : ""}
        >
          {cell}
        </td>
      ))}
    </tr>
  );
};

TableRow.propTypes = {
  rowIndex: PropTypes.number.isRequired,
  row: PropTypes.arrayOf(PropTypes.string).isRequired,
  judgeNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  updateRowTotals: PropTypes.func.isRequired,
};

export default TableRow;
