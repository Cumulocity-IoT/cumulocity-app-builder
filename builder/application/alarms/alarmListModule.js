angular.module("c8y.parts.alarmList", [])
    .controller('alarmListCtrl', alarmListCtrl)
    .component('legacyAlarms', { template: require("@c8y/ng1-modules/devicemanagement-alarmList/views/index.html").default });

// Angular JS controller
function alarmListCtrl(
    $scope,
    $routeParams,
    $q,
    c8yAlarms,
    c8yRealtime,
    c8yModal,
    c8yTitle,
    c8yAlert,
    gettext
  ) {
    const vm = this;

    const filters = {
      pageSize: 10,
      source: '',
      resolved: false
    };

    const pActive = new WeakMap();
    const pFilters = new WeakMap();

    class AlarmSeverityButton {
      constructor(name) {
        this.name = name;
        this.active = false;
        this.filters = {};
        this.count = null;
        this.countLoading = false;
      }

      get active() {
        return pActive.get(this);
      }

      set active(value) {
        pActive.set(this, value);
        this.reloadCount();
      }

      toggleActive() {
        this.active = !this.active;
      }

      get filters() {
        return pFilters.get(this);
      }

      set filters(value) {
        pFilters.set(this, value);
        this.reloadCount();
      }

      reloadCount() {
        if (this.active) {
          this.countLoading = true;
          c8yAlarms
            .getDisplayCount(_.omit(this.filters, this.filters.resolved ? ['pageSize', 'resolved'] : 'pageSize'))
            .then((count) => {
              this.count = count;
            })
            .finally(() => {
              this.countLoading = false;
            });
        }
      }
    }

    const baseRealtimeChannel = '/alarmsWithChildren';
    let realtimeChannel;
    let destroySubscriber;

    _.assign(vm, {
      icon: c8yAlarms.icon,
      realtime: true,
      onVmUnresolvedChange,
      clientSideUnresolved,
      resolveAll,
      refresh,
      isRefreshing
    });

    init();

    function init() {
      const severitiesNames = _.reverse(_.cloneDeep(c8yAlarms.severityList));
      vm.severities = _.map(severitiesNames, name => new AlarmSeverityButton(name));
      vm.unresolved = true;
      onVmUnresolvedChange();
      if ($routeParams.deviceId) {
        filters.source = $routeParams.deviceId;
      }
      updateSeverityFilters();

      vm.severities.forEach((severity) => {
        severity.active = true;
      });

      changeTitle();
      setupRealtime();
    }

    function updateSeverityFilters() {
      vm.severities.forEach((severity) => {
        severity.filters = { ...filters, severity: severity.name };
      });
    }

    function changeTitle() {
      c8yTitle.changeTitle({
        title: gettext('Alarms')
      });
    }

    function setupRealtime() {
      let newRealtimeChannel = `${baseRealtimeChannel}/*`;
      if (filters.source) {
        newRealtimeChannel = `${baseRealtimeChannel}/${filters.source}`;
      }

      if (realtimeChannel) {
        if (newRealtimeChannel === realtimeChannel) {
          return;
        }
        c8yRealtime.removeSubscriber($scope.$id, realtimeChannel);
        destroySubscriber();
      }

      realtimeChannel = newRealtimeChannel;
      addRealtimeListener(`${$scope.$id}-subscribed`, subscribeListener);
      addRealtimeListener('CREATE', notificationListener);
      addRealtimeListener('UPDATE', notificationListener);

      destroySubscriber = $scope.$on('$destroy', () => {
        c8yRealtime.removeSubscriber($scope.$id, realtimeChannel);
      });

      if (vm.realtime) {
        switchRealtime();
      }
    }

    function addRealtimeListener(method, listener) {
      c8yRealtime.addListener($scope.$id, realtimeChannel, method, listener);
    }

    $scope.$watch('vm.realtime', onRealtimeChange);

    function onRealtimeChange() {
      if (vm.realtime) {
        refresh();
      }
      if (vm.realtime !== getRealtimeStatus()) {
        switchRealtime();
      }
    }

    function getRealtimeStatus() {
      return c8yRealtime.getStatus($scope.$id, realtimeChannel);
    }

    function subscribeListener() {
      refresh();
    }

    function notificationListener(evt, data) {
      const severity = _.find(vm.severities, { name: data.severity });

      if (_.isString(severity.count)) {
        severity.reloadCount();
      } else {
        let countChange = 0;

        if (evt === 'CREATE') {
          if (data.status === 'ACTIVE' || data.status === 'ACKNOWLEDGED') {
            countChange = severity.filters.resolved ? 0 : 1;
          }
          if (data.status === 'CLEARED') {
            countChange = severity.filters.resolved ? 1 : 0;
          }
        }

        if (evt === 'UPDATE' && data.status === 'CLEARED') {
          countChange = severity.filters.resolved ? 1 : -1;
        }

        severity.count += countChange;
      }
    }

    function switchRealtime() {
      c8yRealtime.switchRealtime($scope.$id, realtimeChannel);
    }

    function clientSideUnresolved() {
      return $routeParams.deviceId ? vm.unresolved : undefined;
    }

    function onVmUnresolvedChange() {
      filters.resolved = !vm.unresolved;
      updateSeverityFilters();
    }

    function resolveAll() {
      return c8yModal({
        title: gettext('Confirm clearing alarms?'),
        body: gettext('Do you really want to clear all alarms of selected severities?'),
        status: 'danger'
      })
        .then(clearUnresolvedAlarmsFromActiveSeverities)
        .then(({ resolvedImmediately }) => {
          if (resolvedImmediately) {
            c8yAlert.success(gettext('Alarms cleared.'));
          } else {
            c8yAlert.success(gettext('Alarms are being cleared in background.'));
          }
        })
        .then(refresh);
    }

    function clearUnresolvedAlarmsFromActiveSeverities() {
      const severitiesToUpdate = _.filter(vm.severities, 'active');
      const promises = _.map(severitiesToUpdate, (severity) => {
        const filtersObj = {
          resolved: false,
          ..._.pick(severity.filters, ['source', 'severity'])
        };
        // check for alarms on subassets only if query contains source id for parent device
        if (!_.isUndefined(filtersObj.source)) {
          _.assign(filtersObj, {
            withSourceAssets: true,
            withSourceDevices: true
          });
        }
        const updateObj = {
          status: c8yAlarms.status.CLEARED
        };

        return c8yAlarms.updateBulk(filtersObj, updateObj);
      });

      return $q.all(promises)
        .then(responses => ({
          resolvedImmediately: _.every(responses, res => res.status === 200)
        }));
    }

    function refresh() {
      $scope.$broadcast('alarmListRefresh');
      vm.severities.forEach(severity => severity.reloadCount());
    }

    function isRefreshing() {
      return _.some(vm.severities, 'refreshing');
    }
  }
