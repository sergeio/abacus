import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import EventData from './EventData';

const styles = theme => {
    return {
      root: {
        display: 'flex',
      },
      content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        // TODO: Figure out how to make this play nicely with flexbox and the
        // navigation header
        height: '90vh',
        overflow: 'auto',
      },
      tableContainer: {
        height: 320,
      },

      appBarSpacer: theme.mixins.toolbar,
    }
}

class Dashboard extends React.Component {
  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <CssBaseline />
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          <div className={classes.tableContainer}>
            <EventData />
          </div>
        </main>
      </div>
    );
  }
}

Dashboard.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Dashboard);
