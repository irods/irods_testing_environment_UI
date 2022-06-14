import React, { Fragment } from "react";
import { makeStyles } from "@material-ui/core";

const RADIUS_DOT = 20;
const useStyles = makeStyles(() => ({
  circle: {
    borderRadius: RADIUS_DOT,
    height: RADIUS_DOT * 2,
    width: RADIUS_DOT * 2,
    padding: 0
  }
}));

const ColoredCircle = ({ color }) => {
  const styles = { backgroundColor: color, color: color };
  const classes = useStyles();

  return color ? (
    <Fragment>
      <span className={classes.circle} style={styles}>
        ===
      </span>
    </Fragment>
  ) : null;
};

export default ColoredCircle;
