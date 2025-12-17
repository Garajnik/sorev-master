import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

export function ScoreChip(props) {
  const { number } = props

  const CustomChip = styled(Chip)(() => ({
    width: 30,
    height: 30,
    padding: 0,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: "black",
    background: '#ffcf33',
    '& .MuiChip-label': {
      fontSize: '1rem',
      textOverflow: "unset"
    },
  }));

  return (
    <>
      {number ? <CustomChip variant='filled' color='warning' label={number} /> : <></>}
    </>
  );
}
