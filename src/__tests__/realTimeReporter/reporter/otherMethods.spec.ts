/*
 *  Copyright 2020 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

// @ts-ignore
import RPClient from 'reportportal-client';
// @ts-ignore
import { EVENTS as CLIENT_EVENTS } from 'reportportal-client/lib/events';
import { EVENTS, LOG_LEVELS, STATUSES } from '../../../constants';
import { RealTimeReporter } from '../../../realTimeReporter';
import * as utils from '../../../realTimeReporter/utils';
import { getDefaultMockConfig, getStorageTestItemMock, RPClientMock } from '../../mocks';
import { LogRQ, StorageTestItem } from '../../../models';

describe('constructor', function () {
  let reporter: RealTimeReporter;

  beforeEach(() => {
    const config = getDefaultMockConfig();
    const client = new RPClientMock();

    reporter = new RealTimeReporter(config);
    // @ts-ignore access to the class private property
    reporter.client = client;
    // @ts-ignore access to the class private property
    reporter.launchId = 'tempLaunchId';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerEventListeners (called in reporter constructor)', function () {
    const spySubscribeToEvent: jest.SpyInstance = jest.spyOn(utils, 'subscribeToEvent')
      .mockImplementation((event: EVENTS | CLIENT_EVENTS, handler: (params: any) => void) => {});

    test('invokes subscribeToEvent the 6 times for necessary events', function () {
      expect(spySubscribeToEvent).toHaveBeenCalledTimes(6);
    });

    test('invokes subscribeToEvent for START_TEST_ITEM event', function () {
      expect(spySubscribeToEvent).toHaveBeenNthCalledWith(
        1,
        EVENTS.START_TEST_ITEM,
        // @ts-ignore access to the class private property
        reporter.startTestItem
      );
    });

    test('invokes subscribeToEvent for FINISH_TEST_ITEM event', function () {
      expect(spySubscribeToEvent).toHaveBeenNthCalledWith(
        2,
        EVENTS.FINISH_TEST_ITEM,
        // @ts-ignore access to the class private property
        reporter.finishTestItem
      );
    });

    test('invokes subscribeToEvent for ADD_LOG event from CLIENT_EVENTS', function () {
      expect(spySubscribeToEvent).toHaveBeenNthCalledWith(
        3,
        CLIENT_EVENTS.ADD_LOG,
        // @ts-ignore access to the class private property
        reporter.sendLogToItem
      );
    });

    test('invokes subscribeToEvent for ADD_LAUNCH_LOG event from CLIENT_EVENTS', function () {
      expect(spySubscribeToEvent).toHaveBeenNthCalledWith(
        4,
        CLIENT_EVENTS.ADD_LAUNCH_LOG,
        // @ts-ignore access to the class private property
        reporter.sendLogToLaunch
      );
    });

    test('invokes subscribeToEvent for ADD_ATTRIBUTES event from CLIENT_EVENTS', function () {
      expect(spySubscribeToEvent).toHaveBeenNthCalledWith(
        5,
        CLIENT_EVENTS.ADD_ATTRIBUTES,
        // @ts-ignore access to the class private property
        reporter.addItemAttributes
      );
    });

    test('invokes subscribeToEvent for SET_DESCRIPTION event from CLIENT_EVENTS', function () {
      expect(spySubscribeToEvent).toHaveBeenNthCalledWith(
        6,
        CLIENT_EVENTS.SET_DESCRIPTION,
        // @ts-ignore access to the class private property
        reporter.setItemDescription
      );
    });
  });

  describe('getFinishItemObj', function () {
    const storageTestItem: StorageTestItem = getStorageTestItemMock('itemName');

    test('should return PASSED status in case of no testResult', function () {
      // @ts-ignore access to the class private property
      const finishItemObj = reporter.getFinishItemObj(null, storageTestItem);
      const { id, ...data } = storageTestItem;

      expect(finishItemObj).toEqual({
        ...data,
        status: STATUSES.PASSED,
      });
    });

    test('should return PASSED status in case of no results in testResult', function () {
      // @ts-ignore access to the class private property
      const finishItemObj = reporter.getFinishItemObj(
        {
          results: null,
        },
        storageTestItem,
      );
      const { id, ...data } = storageTestItem;

      expect(finishItemObj).toEqual({
        ...data,
        status: STATUSES.PASSED,
      });
    });

    test('invokes calculateTestItemStatus in case of results exists to receive proper item status', function () {
      const testResult = {
        name: 'testItem',
        results: {
          testcases: {
            'testItem': {
              passed: 1,
              skipped: 2,
              failed: 1,
            }
          }
        }
      };
      const spyCalculateTestItemStatus: jest.SpyInstance = jest.spyOn(utils, 'calculateTestItemStatus');

      // @ts-ignore access to the class private property
      reporter.getFinishItemObj(testResult, storageTestItem);

      expect(spyCalculateTestItemStatus).toHaveBeenCalledWith(testResult);
    });

    test('should call the client sendLog method in case of FAILED status', function () {
      const testResult = {
        name: 'testItem',
        results: {
          testcases: {
            'testItem': {
              passed: 1,
              skipped: 0,
              failed: 1,
            }
          }
        }
      };
      jest.spyOn(utils, 'calculateTestItemStatus')
        .mockReturnValueOnce({ status: STATUSES.FAILED, assertionsMessage: 'Error' });
      // @ts-ignore access to the class private property
      const spySendLog: jest.SpyInstance = jest.spyOn(reporter.client, 'sendLog');

      const itemLog: LogRQ = {
        level: LOG_LEVELS.ERROR,
        message: 'Error',
      };

      // @ts-ignore access to the class private property
      reporter.getFinishItemObj(testResult, storageTestItem);

      expect(spySendLog).toHaveBeenCalledWith(storageTestItem.id, itemLog);
    });

    test('should return correct finish item object with status', function () {
      const testResult = {
        name: 'testItem',
        results: {
          testcases: {
            'testItem': {
              passed: 0,
              skipped: 1,
              failed: 0,
            }
          }
        }
      };
      const { id, ...data } = storageTestItem;

      jest.spyOn(utils, 'calculateTestItemStatus')
        .mockReturnValueOnce({ status: STATUSES.SKIPPED, assertionsMessage: null });
      // @ts-ignore access to the class private property
      const finishItemObj = reporter.getFinishItemObj(testResult, storageTestItem);

      expect(finishItemObj).toEqual({
        ...data,
        status: STATUSES.SKIPPED,
      });
    });
  });
});
