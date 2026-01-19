/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import DateTimePicker from 'components/DateTimePicker/DateTimePicker.react';
import Popover from 'components/Popover/Popover.react';
import Position from 'lib/Position';
import React from 'react';
import { dateStringUTC } from 'lib/DateUtils';

export default class DateTimeEntry extends React.Component {
  // 格式化日期为本地时间字符串
  static formatValue(value) {
    if (value instanceof Date) {
      return dateStringUTC(value);
    }
    return value;
  }

  constructor(props) {
    super();

    this.state = {
      open: false,
      position: null,
      value: DateTimeEntry.formatValue(props.value),
    };

    this.rootRef = React.createRef();
    this.inputRef = React.createRef();
  }

  componentWillReceiveProps(props) {
    this.setState({
      value: DateTimeEntry.formatValue(props.value),
    });
  }

  toggle() {
    if (this.state.open) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const node = this.rootRef.current;
    const pos = Position.inDocument(node);
    pos.y += node.clientHeight;
    const height = 230 + node.clientWidth * 0.14;
    if (window.innerHeight - pos.y - height < 40) {
      pos.y = window.innerHeight - height - 40;
    }

    this.setState({
      open: true,
      position: pos,
    });
  }

  close() {
    this.setState({
      open: false,
    });
  }

  inputDate(e) {
    this.setState({ value: e.target.value, open: false });
  }

  commitDate() {
    if (this.state.value === DateTimeEntry.formatValue(this.props.value)) {
      return;
    }
    const date = new Date(this.state.value);
    if (isNaN(date.getTime())) {
      this.setState({ value: DateTimeEntry.formatValue(this.props.value) });
    } else {
      // 用户输入的时间视为本地时间
      this.props.onChange(date);
    }
  }

  focus() {
    this.open();
  }

  render() {
    let popover = null;
    if (this.state.open) {
      popover = (
        <Popover
          fixed={true}
          position={this.state.position}
          onExternalClick={this.close.bind(this)}
          parentContentId={this.props.parentContentId}
        >
          <DateTimePicker
            value={this.props.value}
            width={Math.max(this.rootRef.current.clientWidth, 240)}
            onChange={this.props.onChange}
            close={() => this.setState({ open: false })}
          />
        </Popover>
      );
    }

    return (
      <div className={this.props.className} onClick={this.toggle.bind(this)} ref={this.rootRef}>
        <input
          type="text"
          value={this.state.value}
          onChange={this.inputDate.bind(this)}
          onBlur={this.commitDate.bind(this)}
          ref={this.inputRef}
        />
        {popover}
      </div>
    );
  }
}
