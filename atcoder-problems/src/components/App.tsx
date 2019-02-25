import React, { Component } from 'react';
import { withStyles, createStyles, Theme } from "@material-ui/core/styles";
import { CssBaseline, AppBar, Toolbar, IconButton, Typography, Badge, Drawer, Divider, List } from '@material-ui/core';

const styles = (theme: Theme) => createStyles({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    height: '100vh',
    overflow: 'auto',
  },
  chartContainer: {
    marginLeft: -22,
  },
  tableContainer: {
    height: 320,
  },
  h5: {
    marginBottom: theme.spacing.unit * 2,
  },
});

interface Props {
  classes: any
}
interface State {
}


class App extends Component<Props, State> {
  constructor(props: Props, context?: any) {
    super(props, context);
    this.state = {
    };
  }

  render() {
    let { classes } = this.props;
    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar
          position="absolute"
        >
          <Toolbar className={classes.toolbar}>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              className={classes.title}
            >
              Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          <Typography variant="h4" gutterBottom component="h2">
            Orders
          </Typography>
          <Typography component="div" className={classes.chartContainer}>
          </Typography>
          <Typography variant="h4" gutterBottom component="h2">
            Products
          </Typography>
          <div className={classes.tableContainer}>
          </div>
        </main>
      </div>
    );
  }
}

export default withStyles(styles)(App);
