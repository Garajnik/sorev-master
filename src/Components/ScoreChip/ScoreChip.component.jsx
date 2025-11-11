import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

export function ScoreChip(props) {
  const { number } = props

  const CustomChip = styled(Chip)(() => ({
    width: 50,
    height: 50,
    minWidth: 0,
    padding: 0,
    borderRadius: 10,
    fontSize: "1.3rem",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: "black",
    background: '#ffcf33'
  }));

  return (
    <Stack direction="row" spacing={1}>
      {number ? <CustomChip variant='filled' color='warning' label={number} /> : <></>}
    </Stack>
  );
}
