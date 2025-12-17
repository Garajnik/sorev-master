import { ScoreChip } from "../ScoreChip/ScoreChip.component";
import styles from "./ScoreCell.module.css"


export function ScoreCell(props) {
  const { children } = props

  return (
    <div className={styles.container}>
      {children.map((value, index) => (<ScoreChip key={index + value} number={value} />))}
    </div>
  );
}
