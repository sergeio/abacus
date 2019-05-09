import { createMuiTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
  palette: {

    type: 'dark',

    primary: {
      main: '#32333D',
    },
    secondary: {
      main: '#32333e',
    },
    background: {
      default: '#32333D',
    },
  },
});

export default theme;
