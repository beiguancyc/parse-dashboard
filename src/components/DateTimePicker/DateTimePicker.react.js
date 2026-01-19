/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import Button from 'components/Button/Button.react';
import Calendar from 'components/Calendar/Calendar.react';
import { hoursFrom, getDateMethod } from 'lib/DateUtils';
import PropTypes from 'lib/PropTypes';
import React from 'react';
import styles from 'components/DateTimePicker/DateTimePicker.scss';

export default class DateTimePicker extends React.Component {
  // 默认使用本地时间
  static isLocal(props) {
    return props.local !== false;
  }

  constructor(props) {
    super();
    const useLocal = DateTimePicker.isLocal(props);
    const timeRef = props.value || hoursFrom(new Date(), 1);
    this.state = {
      hours: String(timeRef[getDateMethod(useLocal, 'getHours')]()),
      minutes:
        (timeRef[getDateMethod(useLocal, 'getMinutes')]() < 10 ? '0' : '') +
        String(timeRef[getDateMethod(useLocal, 'getMinutes')]()),
    };
  }

  componentWillReceiveProps(props) {
    const useLocal = DateTimePicker.isLocal(props);
    const timeRef = props.value || hoursFrom(new Date(), 1);
    this.setState({
      hours: String(timeRef[getDateMethod(useLocal, 'getHours')]()),
      minutes:
        (timeRef[getDateMethod(useLocal, 'getMinutes')]() < 10 ? '0' : '') +
        String(timeRef[getDateMethod(useLocal, 'getMinutes')]()),
    });
  }

  changeHours(e) {
    const hoursString = e.target.value;
    if (hoursString === '') {
      return this.setState({ hours: '' });
    }
    if (isNaN(hoursString)) {
      return;
    }
    let hours = parseInt(hoursString, 10);
    if (hours < 0) {
      hours = 0;
    }
    if (hours > 23) {
      hours = 23;
    }
    this.setState({ hours: String(hours) });
  }

  changeMinutes(e) {
    const minutesString = e.target.value;
    if (minutesString === '') {
      return this.setState({ minutes: '' });
    }
    if (isNaN(minutesString)) {
      return;
    }
    let minutes = parseInt(minutesString, 10);
    if (minutes < 0) {
      minutes = 0;
    }
    if (minutes > 59) {
      minutes = 59;
    }
    this.setState({ minutes: String(minutes) });
  }

  commitTime() {
    const useLocal = DateTimePicker.isLocal(this.props);
    const dateRef = this.props.value || new Date();
    const newDate = useLocal
      ? new Date(
        dateRef.getFullYear(),
        dateRef.getMonth(),
        dateRef.getDate(),
        parseInt(this.state.hours, 10),
        parseInt(this.state.minutes, 10)
      )
      : new Date(
        Date.UTC(
          dateRef.getUTCFullYear(),
          dateRef.getUTCMonth(),
          dateRef.getUTCDate(),
          parseInt(this.state.hours, 10),
          parseInt(this.state.minutes, 10)
        )
      );
    this.props.onChange(newDate);
    if (this.props.close) {
      this.props.close();
    }
  }

  render() {
    const useLocal = DateTimePicker.isLocal(this.props);
    return (
      <div
        style={{ width: this.props.width }}
        className={styles.picker}
        onClick={e => e.stopPropagation()}
      >
        <Calendar
          local={useLocal}
          value={this.props.value}
          onChange={newValue => {
            const timeRef = this.props.value || hoursFrom(new Date(), 1);
            const newDate = useLocal
              ? new Date(
                newValue.getFullYear(),
                newValue.getMonth(),
                newValue.getDate(),
                timeRef.getHours(),
                timeRef.getMinutes()
              )
              : new Date(
                Date.UTC(
                  newValue.getUTCFullYear(),
                  newValue.getUTCMonth(),
                  newValue.getUTCDate(),
                  timeRef.getUTCHours(),
                  timeRef.getUTCMinutes()
                )
              );
            this.props.onChange(newDate);
          }}
        />
        <div className={styles.time}>
          <div style={{ float: 'left' }}>
            <input type="text" value={this.state.hours} onChange={this.changeHours.bind(this)} />
            <span> : </span>
            <input
              type="text"
              value={this.state.minutes}
              onChange={this.changeMinutes.bind(this)}
            />
          </div>
          <Button value="Set time" onClick={this.commitTime.bind(this)} primary={true} />
        </div>
      </div>
    );
  }
}

DateTimePicker.propTypes = {
  value: PropTypes.instanceOf(Date).describe('The current date of the picker.'),
  width: PropTypes.number.isRequired.describe('The width of the calendar.'),
  onChange: PropTypes.func.isRequired.describe('A function to call when a new date is selected.'),
  close: PropTypes.func.describe('An optional function to call to close the calendar.'),
  local: PropTypes.bool.describe('An option flag to set when using a local DateTimeInput.'),
};
