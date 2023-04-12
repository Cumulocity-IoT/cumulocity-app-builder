/* eslint-disable no-underscore-dangle */
(function () {
  'use strict';

  angular
    .module("c8y.cockpit.dataPointExplorerUI", ["c8y.cockpit.dataPointExplorer"])
    .component('legacyDataExplorer', {
      template: require("./explorer.html").default,
      controller: c8yDataPointExplorerCtrl
  });

  /* @ngInject */
  function c8yDataPointExplorerCtrl(
    $scope,
    $location,
    $injector,
    c8yUiUtil,
    c8yTitle,
    c8yDataPointSvc,
    c8yActions,
    c8yAlert,
    c8yBase,
    gettext,
    gettextCatalog,
    c8yMeasurements,
    MeasurementsReportSvc,
    INTERVAL_CONSTANTS
  ) {
    $scope.onRealtimeAlarmFn = fn => {
      $scope.onAlarm = fn;
    };
    $scope.onRealtimeEventFn = fn => {
      $scope.onEvent = fn;
    };
    let bucket;

    function onDataPoints(dps, override) {
      if (dps && override) {
        $scope.data.datapoints.length = 0;
        $scope.data.datapoints.push(...dps);
      }
      $scope.data.graphDataPoints = dps;
      const ids = getTargetUniqueIdsList(_.filter(dps, '__active'));
      $scope.channel = ids ? `/measurements/${ids}` : '';
    }

    function onAlarmsEventsConfigs(cfgs) {
      $scope.data.graphAlarmsEventsConfigs = cfgs;
      const ids = getTargetUniqueIdsList(_.filter(cfgs, '__active'));
      $scope.alarmsChannel = ids ? `/alarms/${ids}` : '';
      $scope.eventsChannel = ids ? `/events/${ids}` : '';
    }

    function getTargetUniqueIdsList(objs) {
      return _(objs)
        .map(obj => obj.__target.id)
        .uniq()
        .value()
        .join(',');
    }

    function saveFilters() {
      if ($scope.dontSave || $scope.disableLocalStorage) {
        return;
      }
      const savedFilter = _.pick($scope.data, [
        'dateFrom',
        'dateTo',
        'interval',
        'aggregation',
        'realtime',
        'alarmsEventsConfigs'
      ]);
      c8yDataPointSvc.setSavedFilters(savedFilter, bucket);
    }

    function setTitle() {
      c8yTitle.changeTitle({
        title: gettext('Data explorer')
      });
      /* const ctx = c8yUiUtil.getContext();
      if (!ctx.context && $location.path().match(/data_explorer/)) {
        c8yTitle.changeTitle({
          title: gettext('Data explorer')
        });
      } */
    }

    function setContext() {
      const ctx = c8yUiUtil.getContext();
      if (ctx.context) {
        bucket = `${ctx.context}_${ctx.id}`;
      }
      loadSavedFilter();
    }

    function loadSavedFilter() {
      if ($scope.disableLocalStorage) {
        return;
      }
      const onWatch = _.throttle((newVal, oldVal) => {
        if (newVal !== oldVal) {
          saveFilters();
        }
      }, 500, { leading: false, trailing: true });

      c8yDataPointSvc.getSavedFilters(bucket)
        .then((data) => {
          _.assign($scope.data, data);
          $scope.$watch('data.realtime', onWatch);
          $scope.$watch('data.dateFrom', onWatch);
          $scope.$watch('data.dateTo', onWatch);
          $scope.$watch('data.interval', onWatch);
          $scope.$watch('data.aggregation', onWatch);
          $scope.$watch('data.alarmsEventsConfigs', onWatch, true);
        });
    }

    function hasDashboards() {
      const cachedCheck = hasDashboards._hasDashboard;
      let _hasDashboard = cachedCheck;
      let d;

      if (_.isUndefined(cachedCheck)) {
        try {
          d = $injector.get('dashboardSvc');
          if (d.VERSION === 2) {
            _hasDashboard = d;
          }
        } catch (e) {
          _hasDashboard = false;
        }
      }
      hasDashboards._hasDashboard = _hasDashboard;
      return _hasDashboard;
    }

    function _saveToDashboard(fn) {
      const dash = hasDashboards();
      if (dash) {
        dash[fn]({
          name: 'Data points graph',
          title: gettextCatalog.getString('Data points'),
          _width: 12,
          _height: 5,
          config: {
            datapoints: $scope.data.graphDataPoints,
            alarmsEventsConfigs: $scope.data.graphAlarmsEventsConfigs,
            dateTo: $scope.data.dateTo,
            dateFrom: $scope.data.dateFrom,
            aggregation: $scope.data.aggregation,
            realtime: $scope.data.realtime
          }
        })
          .then(onAddedWidgetSuccess);
      }
    }

    function onAddedWidgetSuccess() {
      c8yAlert.success(gettext('Widget created.'));
    }

    function saveToDashboard() {
      _saveToDashboard('addWidgetToSelectedDashboardInContext');
    }

    function saveToReport() {
      _saveToDashboard('addWidgetToSelectedReport');
    }

    function btnToDashboard() {
      const action = {
        text: bucket ? gettext('Send as widget to dashboard') : gettext('Send as widget to report'),
        action: bucket ? saveToDashboard : saveToReport
      };

      if (hasDashboards() && !$scope.noActions) {
        c8yActions.addAction(action);
      }
    }

    function addDownloadActions() {
      function addDownloadAction(text, format) {
        c8yActions.addAction({
          text,
          action() {
            const filter = {
              dateFrom: moment($scope.data.dateFrom).format(c8yBase.dateFullFormat),
              dateTo: moment($scope.data.dateTo).format(c8yBase.dateFullFormat),
            };

            MeasurementsReportSvc.downloadReportForDatapoints(
              format,
              $scope.data.graphDataPoints,
              filter
            ).catch((e) => {
              if (e && e.message) {
                c8yAlert.warning(e.message);
              }
            });
          }
        });
      }
      addDownloadAction(gettext('Download as CSV'), c8yMeasurements.format.csv);
      addDownloadAction(gettext('Download as Excel'), c8yMeasurements.format.xlsx);
    }

    function recalculate() {
      const { interval } = $scope.data;
      if (!interval || interval === 'custom') {
        return;
      }
      const selected = _.find(INTERVAL_CONSTANTS.intervals, x => x.id === interval) || {};
      if (selected.qty) {
        $scope.data.dateFrom = moment().subtract(selected.qty, selected.unit).toDate();
        $scope.data.dateTo = moment().toDate();
      }
    }

    function onBoxChanged(box) {
      $scope.chartBox = box;
    }

    function getLocalDataPoints() {
      if (_.get($scope, 'data.datapoints.length')) {
        return;
      }
      c8yDataPointSvc
        .listLocal(bucket)
        .then(res => {
          if (res && res.length) {
            onDataPoints(res, true);
          }
        })
        .then(startAutoSave);
    }

    function startAutoSave() {
      $scope.$watch(
        'data.datapoints',
        () => {
          c8yDataPointSvc.saveLocal($scope.data.datapoints, bucket);
        },
        true
      );
    }

    function init() {
      setTitle();
      setContext();
      btnToDashboard();
      getLocalDataPoints();

      if (!$scope.noActions) {
        addDownloadActions();
      }

      $(window).resize(() => {
        $scope.$broadcast('dashboardResize');
        $scope.$apply();
      });

      $scope.onBoxChanged = onBoxChanged;

      $scope.onUpdateDates = function (dateFrom, dateTo) {
        $scope.data.dateFrom = dateFrom;
        const closeEnoughToCurrentMoment = moment().diff(moment(dateTo), 'seconds') < 10;
        if ($scope.data.realtime && !closeEnoughToCurrentMoment) {
          $scope.data.realtime = false;
        }
        $scope.data.dateTo = dateTo;
      };

      $scope.onUpdateDisplayedDates = function (dateFrom, dateTo) {
        $scope.data.displayedDateFrom = dateFrom;
        $scope.data.displayedDateTo = dateTo;
      };

      $scope.savedFilter = {
        config: {},
        datapoints: []
      };
      $scope.data = $scope.data || _.cloneDeep($scope.savedFilter);
      recalculate();
      $scope.$watch('data.datapoints', () => onDataPoints($scope.data.datapoints), true);
      $scope.$watch('data.alarmsEventsConfigs', onAlarmsEventsConfigs, true);
    }

    init();
  }
}());
