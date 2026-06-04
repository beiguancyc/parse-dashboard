/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import PropTypes from 'lib/PropTypes';
import React from 'react';
import ReactDOM from 'react-dom';
import styles from 'components/DataBrowserHeader/DataBrowserHeader.scss';
import baseStyles from 'stylesheets/base.scss';
import { DragSource, DropTarget } from 'react-dnd';

const Types = {
  DATA_BROWSER_HEADER: 'dataBrowserHeader',
};

const dataBrowserHeaderTarget = {
  drop(props, monitor) {
    const item = monitor.getItem();

    if (!item) {
      return;
    }

    const dragIndex = item.index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    props.moveDataBrowserHeader(dragIndex, hoverIndex);
  },
};

const dataBrowserHeaderSource = {
  beginDrag(props) {
    return {
      name: props.name,
      index: props.index,
    };
  },
};

@DropTarget(Types.DATA_BROWSER_HEADER, dataBrowserHeaderTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
}))
@DragSource(Types.DATA_BROWSER_HEADER, dataBrowserHeaderSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class DataBrowserHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showTooltip: false, tooltipPos: null };
    this.noteIconRef = React.createRef();
  }

  handleMouseEnter = () => {
    const el = this.noteIconRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      this.setState({
        showTooltip: true,
        tooltipPos: {
          top: rect.bottom + 6,
          left: rect.left + rect.width / 2,
        },
      });
    }
  };

  handleMouseLeave = () => {
    this.setState({ showTooltip: false, tooltipPos: null });
  };

  render() {
    const {
      connectDragSource,
      connectDropTarget,
      name,
      type,
      targetClass,
      order,
      style,
      isDragging,
      isOver,
      note,
    } = this.props;
    const classes = [styles.header, baseStyles.unselectable];
    if (order) {
      classes.push(styles[order]);
    }
    if (isOver && !isDragging) {
      classes.push(styles.over);
    }
    if (isDragging) {
      classes.push(styles.dragging);
    }

    let noteIndicator = null;
    if (note) {
      noteIndicator = (
        <span
          ref={this.noteIconRef}
          className={styles.noteIcon}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={e => e.stopPropagation()}
        >
          ✎
        </span>
      );
    }

    // 通过 Portal 将 tooltip 渲染到 body，避免被父容器 overflow:hidden 截断
    const tooltip =
      this.state.showTooltip && this.state.tooltipPos
        ? ReactDOM.createPortal(
            <div
              className={styles.noteTooltip}
              style={{
                top: this.state.tooltipPos.top,
                left: this.state.tooltipPos.left,
              }}
            >
              {note}
            </div>,
            document.body
          )
        : null;

    const typeText = targetClass ? `${type} <${targetClass}>` : type;

    return connectDragSource(
      connectDropTarget(
        <div className={classes.join(' ')} style={style}>
          <div className={styles.name}>
            {name}
            {noteIndicator}
          </div>
          <div className={styles.type}>
            {typeText}
            {note && <span className={styles.noteText} title={note}> · {note}</span>}
          </div>
          {tooltip}
        </div>
      )
    );
  }
}

export default DataBrowserHeader;

DataBrowserHeader.propTypes = {
  name: PropTypes.string.isRequired.describe('The name of the column.'),
  type: PropTypes.string.describe('The type of the column.'),
  targetClass: PropTypes.string.describe('The target class for a Pointer or Relation.'),
  order: PropTypes.oneOf(['ascending', 'descending']).describe(
    'A sort ordering that displays as an arrow in the header.'
  ),
};
