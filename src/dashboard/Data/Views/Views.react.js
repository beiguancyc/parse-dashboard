import CategoryList from 'components/CategoryList/CategoryList.react';
import SidebarAction from 'components/Sidebar/SidebarAction';
import TableView from 'dashboard/TableView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Icon from 'components/Icon/Icon.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import Parse from 'parse';
import React from 'react';
import Notification from 'dashboard/Data/Browser/Notification.react';
import Pill from 'components/Pill/Pill.react';
import DragHandle from 'components/DragHandle/DragHandle.react';
import CreateViewDialog from './CreateViewDialog.react';
import EditViewDialog from './EditViewDialog.react';
import DeleteViewDialog from './DeleteViewDialog.react';
import ViewValueDialog from './ViewValueDialog.react';
import BrowserMenu from 'components/BrowserMenu/BrowserMenu.react';
import MenuItem from 'components/BrowserMenu/MenuItem.react';
import Separator from 'components/BrowserMenu/Separator.react';
import EmptyState from 'components/EmptyState/EmptyState.react';
import * as ViewPreferences from 'lib/ViewPreferences';
import generatePath from 'lib/generatePath';
import { withRouter } from 'lib/withRouter';
import subscribeTo from 'lib/subscribeTo';
import { ActionTypes as SchemaActionTypes } from 'lib/stores/SchemaStore';
import styles from './Views.scss';
import tableStyles from 'dashboard/TableView.scss';
import browserStyles from 'dashboard/Data/Browser/Browser.scss';

export default
@subscribeTo('Schema', 'schema')
@withRouter
class Views extends TableView {
  constructor() {
    super();
    this.section = 'Core';
    this.subsection = 'Views';
    this._isMounted = false;
    this.state = {
      views: [],
      counts: {},
      data: [],
      order: [],
      columns: {},
      tableWidth: 0,
      showCreate: false,
      editView: null,
      editIndex: null,
      deleteIndex: null,
      lastError: null,
      lastNote: null,
      loading: false,
      viewValue: null,
    };
    this.headersRef = React.createRef();
    this.noteTimeout = null;
    this.action = new SidebarAction('Create a view', () => this.setState({ showCreate: true }));
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillMount() {
    this.props.schema.dispatch(SchemaActionTypes.FETCH).then(() => this.loadViews(this.context));
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearTimeout(this.noteTimeout);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context !== nextContext) {
      this.props.schema.dispatch(SchemaActionTypes.FETCH).then(() => this.loadViews(nextContext));
    }
    if (this.props.params.name !== nextProps.params.name || this.context !== nextContext) {
      window.scrollTo({ top: 0 });
      this.loadData(nextProps.params.name);
    }
  }

  loadViews(app) {
    const views = ViewPreferences.getViews(app.applicationId);
    this.setState({ views, counts: {} }, () => {
      views.forEach(view => {
        if (view.showCounter) {
          new Parse.Query(view.className)
            .aggregate(view.query, { useMasterKey: true })
            .then(res => {
              if (this._isMounted) {
                this.setState(({ counts }) => ({
                  counts: { ...counts, [view.name]: res.length },
                }));
              }
            })
            .catch(error => {
              if (this._isMounted) {
                this.showNote(`Request failed: ${error.message || 'Unknown error occurred'}`, true);
              }
            });
        }
      });
      if (this._isMounted) {
        this.loadData(this.props.params.name);
      }
    });
  }

  loadData(name) {
    if (this._isMounted) {
      this.setState({ loading: true });
    }
    if (!name) {
      if (this._isMounted) {
        this.setState({ data: [], order: [], columns: {}, loading: false });
      }
      return;
    }
    const view = (this.state.views || []).find(v => v.name === name);
    if (!view) {
      if (this._isMounted) {
        this.setState({ data: [], order: [], columns: {}, loading: false });
      }
      return;
    }
    new Parse.Query(view.className)
      .aggregate(view.query, { useMasterKey: true })
      .then(results => {
        const columns = {};
        const computeWidth = str => {
          let text = str;
          if (text === undefined) {
            text = '';
          } else if (text && typeof text === 'object') {
            text = text.__type === 'Date' && text.iso ? text.iso : JSON.stringify(text);
          }
          text = String(text);
          if (typeof document !== 'undefined') {
            const canvas =
              computeWidth._canvas || (computeWidth._canvas = document.createElement('canvas'));
            const context = canvas.getContext('2d');
            context.font = '12px "Source Code Pro", "Courier New", monospace';
            const width = context.measureText(text).width + 32;
            return Math.max(width, 40);
          }
          return Math.max((text.length + 2) * 12, 40);
        };
        results.forEach(item => {
          Object.keys(item).forEach(key => {
            const val = item[key];
            let type = 'String';
            if (typeof val === 'number') {
              type = 'Number';
            } else if (typeof val === 'boolean') {
              type = 'Boolean';
            } else if (val && typeof val === 'object') {
              if (val.__type === 'Date') {
                type = 'Date';
              } else if (val.__type === 'Pointer') {
                if (val.className && val.objectId) {
                  type = 'Pointer';
                } else {
                  type = 'Object';
                }
              } else if (val.__type === 'File') {
                type = 'File';
              } else if (val.__type === 'GeoPoint') {
                type = 'GeoPoint';
              } else {
                type = 'Object';
              }
            }
            if (!columns[key]) {
              columns[key] = { type, width: Math.min(computeWidth(key), 200) };
            }
            const width = computeWidth(val);
            if (width > columns[key].width && columns[key].width < 200) {
              columns[key].width = Math.min(width, 200);
            }
          });
        });
        const colNames = Object.keys(columns);
        const order = colNames.map(name => ({ name, width: columns[name].width }));
        const tableWidth = order.reduce((sum, col) => sum + col.width, 0);
        if (this._isMounted) {
          this.setState({ data: results, order, columns, tableWidth, loading: false });
        }
      })
      .catch(error => {
        if (this._isMounted) {
          this.showNote(`Request failed: ${error.message || 'Unknown error occurred'}`, true);
          this.setState({ data: [], order: [], columns: {}, loading: false });
        }
      });
  }

  onRefresh() {
    this.loadData(this.props.params.name);
  }

  tableData() {
    return this.state.data;
  }

  renderContent() {
    const toolbar = this.renderToolbar();
    const data = this.tableData();
    const footer = this.renderFooter();
    let content = null;
    let headers = null;
    if (data !== undefined) {
      if (!Array.isArray(data)) {
        console.warn('tableData() needs to return an array of objects');
      } else {
        if (data.length === 0) {
          content = (
            <div className={tableStyles.empty} style={{ top: 96 }}>
              {this.renderEmpty()}
            </div>
          );
        } else {
          content = (
            <div className={tableStyles.rows}>
              <table style={{ width: this.state.tableWidth, tableLayout: 'fixed' }}>
                {this.renderColGroup()}
                <tbody>{data.map(row => this.renderRow(row))}</tbody>
              </table>
              {footer}
            </div>
          );
          headers = this.renderHeaders();
        }
      }
    }
    const extras = this.renderExtras ? this.renderExtras() : null;
    const loading = this.state ? this.state.loading : false;
    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={tableStyles.content} style={{ overflowX: 'auto', paddingTop: 96 }}>
            <div style={{ width: this.state.tableWidth }}>
              <div
                className={tableStyles.headers}
                style={{
                  width: this.state.tableWidth,
                  right: 'auto',
                  position: 'sticky',
                  top: 0,
                  left: 0,
                }}
                ref={this.headersRef}
              >
                {headers}
              </div>
              {content}
            </div>
          </div>
        </LoaderContainer>
        {toolbar}
        {extras}
      </div>
    );
  }

  renderRow(row) {
    return (
      <tr key={JSON.stringify(row)} className={styles.tableRow}>
        {this.state.order.map(({ name }) => {
          const value = row[name];
          let type = 'String';
          if (typeof value === 'number') {
            type = 'Number';
          } else if (typeof value === 'boolean') {
            type = 'Boolean';
          } else if (value && typeof value === 'object') {
            if (value.__type === 'Date') {
              type = 'Date';
            } else if (value.__type === 'Pointer') {
              if (value.className && value.objectId) {
                type = 'Pointer';
              } else {
                type = 'Object';
              }
            } else if (value.__type === 'File') {
              type = 'File';
            } else if (value.__type === 'GeoPoint') {
              type = 'GeoPoint';
            } else {
              type = 'Object';
            }
          }
          let content = '';
          const hasPill = type === 'Pointer' && value && value.className && value.objectId;
          if (hasPill) {
            const id = value.objectId;
            const className = value.className;
            content = (
              <Pill
                value={id}
                onClick={() => this.handlePointerClick({ className, id })}
                followClick
                shrinkablePill
              />
            );
          } else if (type === 'Object') {
            content = JSON.stringify(value);
          } else if (type === 'Date') {
            content = value && value.iso ? value.iso : String(value);
          } else if (value === undefined) {
            content = '';
          } else {
            content = String(value);
          }
          const isViewable = ['String', 'Number', 'Object'].includes(type);
          const classes = [styles.cell];
          if (hasPill) {
            classes.push(styles.pillCell);
          }
          let cellContent = content;
          if (isViewable) {
            cellContent = (
              <span
                className={styles.clickableText}
                onClick={() => this.handleValueClick(value)}
              >
                {content}
              </span>
            );
          }
          return (
            <td key={name} className={classes.join(' ')}>
              {cellContent}
            </td>
          );
        })}
      </tr>
    );
  }

  renderColGroup() {
    return (
      <colgroup>
        {this.state.order.map(({ width }, i) => (
          <col key={i} style={{ width }} />
        ))}
      </colgroup>
    );
  }

  handleResize(index, delta) {
    this.setState(({ order }) => {
      const newOrder = [...order];
      newOrder[index] = {
        ...newOrder[index],
        width: Math.max(40, newOrder[index].width + delta),
      };
      const tableWidth = newOrder.reduce((sum, col) => sum + col.width, 0);
      return { order: newOrder, tableWidth };
    });
  }

  renderHeaders() {
    return this.state.order.map(({ name, width }, i) => (
      <div key={name} className={styles.headerWrap} style={{ width }}>
        {name}
        <DragHandle className={styles.handle} onDrag={delta => this.handleResize(i, delta)} />
      </div>
    ));
  }

  renderEmpty() {
    if (!this.props.params.name) {
      if (this.state.views.length > 0) {
        return (
          <EmptyState icon="visibility" title="Views" description="Select a view to load the data." />
        );
      }
      return (
        <EmptyState
          icon="visibility"
          title="Views"
          description={
            <span>
              Use views to display aggregated data from your classes.{' '}
              <a
                href="https://docs.parseplatform.org/dashboard/guide/#views"
                target="_blank"
                rel="noreferrer"
              >
                Learn more
              </a>
              .
            </span>
          }
          cta="Create a view"
          action={() => this.setState({ showCreate: true })}
        />
      );
    }
    return <div>No data available</div>;
  }

  renderSidebar() {
    const categories = this.state.views.map((view, index) => ({
      name: view.name,
      id: view.name,
      count: this.state.counts[view.name],
      onEdit: () => {
        this.setState({ editView: view, editIndex: index });
      },
    }));
    const current = this.props.params.name || '';
    return (
      <CategoryList
        current={current}
        params={this.props.location?.search}
        linkPrefix={'views/'}
        classClicked={() => {
          window.scrollTo({ top: 0 });
        }}
        categories={categories}
      />
    );
  }

  renderToolbar() {
    const subsection = this.props.params.name || '';
    let editMenu = null;
    let refreshButton = null;
    if (this.props.params.name) {
      editMenu = (
        <BrowserMenu title="Edit" icon="edit-solid" setCurrent={() => {}}>
          <MenuItem
            text="Edit view"
            onClick={() => {
              const index = this.state.views.findIndex(v => v.name === this.props.params.name);
              if (index >= 0) {
                this.setState({
                  editView: this.state.views[index],
                  editIndex: index,
                });
              }
            }}
          />
          <Separator />
          <MenuItem
            text="Delete view"
            onClick={() => {
              const index = this.state.views.findIndex(v => v.name === this.props.params.name);
              if (index >= 0) {
                this.setState({ deleteIndex: index });
              }
            }}
          />
        </BrowserMenu>
      );
      refreshButton = (
        <>
          <a className={browserStyles.toolbarButton} onClick={this.onRefresh.bind(this)}>
            <Icon name="refresh-solid" width={14} height={14} />
            <span>Refresh</span>
          </a>
          <div className={browserStyles.toolbarSeparator} />
        </>
      );
    }

    return (
      <Toolbar section="Views" subsection={subsection}>
        {refreshButton}
        {editMenu}
      </Toolbar>
    );
  }

  renderExtras() {
    let extras = null;
    if (this.state.viewValue !== null) {
      extras = (
        <ViewValueDialog
          value={this.state.viewValue}
          onClose={() => this.setState({ viewValue: null })}
        />
      );
    } else if (this.state.showCreate) {
      let classNames = [];
      if (this.props.schema?.data) {
        const classes = this.props.schema.data.get('classes');
        if (classes) {
          classNames = Object.keys(classes.toObject());
        }
      }
      extras = (
        <CreateViewDialog
          classes={classNames}
          onCancel={() => this.setState({ showCreate: false })}
          onConfirm={view => {
            this.setState(
              state => ({ showCreate: false, views: [...state.views, view] }),
              () => {
                ViewPreferences.saveViews(this.context.applicationId, this.state.views);
                this.loadViews(this.context);
              }
            );
          }}
        />
      );
    } else if (this.state.editView) {
      let classNames = [];
      if (this.props.schema?.data) {
        const classes = this.props.schema.data.get('classes');
        if (classes) {
          classNames = Object.keys(classes.toObject());
        }
      }
      extras = (
        <EditViewDialog
          classes={classNames}
          view={this.state.editView}
          onCancel={() => this.setState({ editView: null, editIndex: null })}
          onConfirm={view => {
            this.setState(
              state => {
                const newViews = [...state.views];
                newViews[state.editIndex] = view;
                return { editView: null, editIndex: null, views: newViews };
              },
              () => {
                ViewPreferences.saveViews(this.context.applicationId, this.state.views);
                this.loadViews(this.context);
              }
            );
          }}
        />
      );
    } else if (this.state.deleteIndex !== null) {
      const name = this.state.views[this.state.deleteIndex]?.name || '';
      extras = (
        <DeleteViewDialog
          name={name}
          onCancel={() => this.setState({ deleteIndex: null })}
          onConfirm={() => {
            this.setState(
              state => {
                const newViews = state.views.filter((_, i) => i !== state.deleteIndex);
                return { deleteIndex: null, views: newViews };
              },
              () => {
                ViewPreferences.saveViews(this.context.applicationId, this.state.views);
                if (this.props.params.name === name) {
                  const path = generatePath(this.context, 'views');
                  this.props.navigate(path);
                }
                this.loadViews(this.context);
              }
            );
          }}
        />
      );
    }
    let notification = null;
    if (this.state.lastError) {
      notification = <Notification note={this.state.lastError} isErrorNote={true} />;
    } else if (this.state.lastNote) {
      notification = <Notification note={this.state.lastNote} isErrorNote={false} />;
    }
    return (
      <>
        {extras}
        {notification}
      </>
    );
  }

  handlePointerClick({ className, id, field = 'objectId' }) {
    const filters = JSON.stringify([{ field, constraint: 'eq', compareTo: id }]);
    const path = generatePath(
      this.context,
      `browser/${className}?filters=${encodeURIComponent(filters)}`
    );
    this.props.navigate(path);
  }

  handleValueClick(value) {
    this.setState({ viewValue: value });
  }

  showNote(message, isError) {
    if (!message) {
      return;
    }
    clearTimeout(this.noteTimeout);
    if (isError) {
      this.setState({ lastError: message, lastNote: null });
    } else {
      this.setState({ lastNote: message, lastError: null });
    }
    this.noteTimeout = setTimeout(() => {
      this.setState({ lastError: null, lastNote: null });
    }, 3500);
  }
}
