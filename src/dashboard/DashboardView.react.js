/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import React from 'react';
import Sidebar from 'components/Sidebar/Sidebar.react';
import styles from 'dashboard/Dashboard.scss';
import Icon from 'components/Icon/Icon.react';
import baseStyles from 'stylesheets/base.scss';
import Button from 'components/Button/Button.react';
import { CurrentApp } from 'context/currentApp';

export default class DashboardView extends React.Component {
  static contextType = CurrentApp;
  /* A DashboardView renders two pieces: the sidebar, and the app itself */

  constructor() {
    super();
    this.state = {
      route: '',
    };
  }

  componentDidUpdate() {
    this.onRouteChanged();
  }
  componentDidMount() {
    this.onRouteChanged();
  }

  onRouteChanged() {
    const path = this.props.location?.pathname ?? window.location.pathname;
    const route = path.split('apps')[1].split('/')[2];
    if (route !== this.state.route) {
      this.setState({ route });
    }
  }

  render() {
    let sidebarChildren = null;
    if (typeof this.renderSidebar === 'function') {
      sidebarChildren = this.renderSidebar();
    }
    const appSlug = this.context ? this.context.slug : '';

    if (!this.context.hasCheckedForMigraton) {
      this.context.getMigrations().promise.then(
        () => this.forceUpdate(),
        () => {}
      );
    }

    const features = this.context.serverInfo.features;

    const coreSubsections = [];
    if (
      features.schemas &&
      features.schemas.addField &&
      features.schemas.removeField &&
      features.schemas.addClass &&
      features.schemas.removeClass
    ) {
      coreSubsections.push({
        name: 'Browser',
        link: '/browser',
      });
    }

    if (features.cloudCode && features.cloudCode.viewCode) {
      coreSubsections.push({
        name: 'Cloud Code',
        link: '/cloud_code',
      });
    }

    //webhooks requires removal of heroku link code, then it should work.
    if (
      features.hooks &&
      features.hooks.create &&
      features.hooks.read &&
      features.hooks.update &&
      features.hooks.delete
    ) {
      coreSubsections.push({
        name: 'Webhooks',
        link: '/webhooks',
      });
    }

    if (features.cloudCode && features.cloudCode.jobs) {
      coreSubsections.push({
        name: 'Jobs',
        link: '/jobs',
      });
    }

    if (features.logs && Object.keys(features.logs).some(key => features.logs[key])) {
      coreSubsections.push({
        name: 'Logs',
        link: '/logs',
      });
    }

    if (
      features.globalConfig &&
      features.globalConfig.create &&
      features.globalConfig.read &&
      features.globalConfig.update &&
      features.globalConfig.delete
    ) {
      coreSubsections.push({
        name: 'Config',
        link: '/config',
      });
    }

    if (!this.context.serverInfo.error) {
      coreSubsections.push({
        name: 'API Console',
        link: '/api_console',
      });
    }

    if (this.context.migration) {
      coreSubsections.push({
        name: 'Migration',
        link: '/migration',
      });
    }
    const pushSubsections = [];

    if (features.push && features.push.immediatePush) {
      pushSubsections.push({
        name: 'Send New Push',
        link: '/push/new',
      });
    }

    if (features.push && features.push.storedPushData) {
      pushSubsections.push({
        name: 'Past Pushes',
        link: '/push/activity',
      });
    }

    if (features.push && features.push.pushAudiences) {
      pushSubsections.push({
        name: 'Audiences',
        link: '/push/audiences',
      });
    }

    const analyticsSidebarSections = [];

    //These analytics pages may never make it into parse server
    /*
    if (...) {
      analyticsSidebarSections.push({
        name: 'Overview',
        link: '/analytics/overview'
      });
    }

    if (...) {
      analyticsSidebarSections.push({
        name: 'Explorer',
        link: '/analytics/explorer'
      });
    }*/

    //These ones might, but require some endpoints to added to Parse Server
    /*
    if (features.analytics && features.analytics.retentionAnalysis) {
      analyticsSidebarSections.push({
        name: 'Retention',
        link: '/analytics/retention'
      });
    }

    if (features.analytics && features.analytics.performanceAnalysis) {
      analyticsSidebarSections.push({
        name: 'Performance',
        link: '/analytics/performance'
      });
    }

    if (features.analytics && features.analytics.slowQueries) {
      analyticsSidebarSections.push({
        name: 'Slow Queries',
        link: '/analytics/slow_queries'
      });
    }
    */

    const settingsSections = [
      {
        name: 'Dashboard',
        link: '/settings/dashboard',
      },
    ];

    if (this.context.enableSecurityChecks) {
      settingsSections.push({
        name: 'Security',
        link: '/settings/security',
      });
    }

    // Settings - nothing remotely like this in parse-server yet. Maybe it will arrive soon.
    /*
    if (features.generalSettings) {
      settingsSections.push({
        name: 'General',
        link: '/settings/general'
      });
    }

    if (features.keysSettings) {
      settingsSections.push({
        name: 'Security & Keys',
        link: '/settings/keys'
      });
    }

    if (features.usersSettings) {
      settingsSections.push({
        name: 'Users',
        link: '/settings/users'
      })
    }

    if (features.pushSettings) {
      settingsSections.push({
        name: 'Push',
        link: '/settings/push'
      });
    }

    if (features.hostingEmailsSettings) {
      settingsSections.push({
        name: 'Hosting and Emails',
        link: '/settings/hosting'
      });
    }*/

    const appSidebarSections = [];

    if (coreSubsections.length > 0) {
      appSidebarSections.push({
        name: 'Core',
        icon: 'core',
        link: '/browser',
        subsections: coreSubsections,
      });
    }

    if (pushSubsections.length > 0) {
      appSidebarSections.push({
        name: 'Push',
        icon: 'push-outline',
        link: '/push',
        style: { paddingLeft: '16px' },
        subsections: pushSubsections,
      });
    }

    if (analyticsSidebarSections.length > 0) {
      appSidebarSections.push({
        name: 'Analytics',
        icon: 'analytics-outline',
        link: '/analytics',
        subsections: analyticsSidebarSections,
      });
    }

    if (settingsSections.length > 0) {
      appSidebarSections.push({
        name: 'App Settings',
        icon: 'gear-solid',
        link: '/settings',
        subsections: settingsSections,
      });
    }

    const sidebar = (
      <Sidebar
        sections={appSidebarSections}
        appSelector={true}
        section={this.section}
        subsection={this.subsection}
        prefix={'/apps/' + appSlug}
        action={this.action}
        primaryBackgroundColor={this.context.primaryBackgroundColor}
        secondaryBackgroundColor={this.context.secondaryBackgroundColor}
      >
        {sidebarChildren}
      </Sidebar>
    );

    let content = <div className={styles.content}>{this.renderContent()}</div>;
    const canRoute = [...coreSubsections, ...pushSubsections, ...settingsSections]
      .map(({ link }) => link.split('/')[1])
      .includes(this.state.route);

    if (!canRoute) {
      content = (
        <div className={styles.empty}>
          <div className={baseStyles.center}>
            <div className={styles.cloud}>
              <Icon width={110} height={110} name="cloud-surprise" fill="#1e3b4d" />
            </div>
            <div className={styles.loadingError}>Feature unavailable</div>
          </div>
        </div>
      );
    }

    if (this.context.serverInfo.error) {
      content = (
        <div className={styles.empty}>
          <div className={baseStyles.center}>
            <div className={styles.cloud}>
              <Icon width={110} height={110} name="cloud-surprise" fill="#1e3b4d" />
            </div>
            <div className={styles.loadingError}>
              {this.context.serverInfo.error.replace(/-/g, '\u2011')}
            </div>
            <Button color="white" value="Reload" width="120px" onClick={() => location.reload()} />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.dashboard}>
        {content}
        {sidebar}
      </div>
    );
  }
}
