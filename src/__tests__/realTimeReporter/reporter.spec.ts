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

import { StartLaunchRQ } from '../../models';
import { RealTimeReporter } from '../../realTimeReporter';
import * as reporterUtils from '../../realTimeReporter/utils';
import { getDefaultMockConfig, RPClientMock } from '../mocks';

describe('RealTimeReporter', function() {
  let reporter: RealTimeReporter;

  beforeEach(() => {
    const config = getDefaultMockConfig();
    const client = new RPClientMock();

    reporter = new RealTimeReporter(config);
    // @ts-ignore access to the class private property
    reporter.client = client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('startLaunch: should start launch by calling the ReportPortal client startLaunch method', function () {
    const launchObj: StartLaunchRQ = {
      description: 'Launch description',
      attributes: [{ key: 'example', value: 'true' }],
    };
    const spyGetStartLaunchObj = jest.spyOn(reporterUtils, 'getStartLaunchObj')
      .mockReturnValueOnce(launchObj);

    reporter.startLaunch(launchObj);

    expect(spyGetStartLaunchObj).toHaveBeenCalledWith(launchObj);
    // @ts-ignore access to the class private property
    expect(reporter.client.startLaunch).toHaveBeenCalledWith(launchObj);
  });

  test('finishLaunch: should finish launch by calling the ReportPortal client finishLaunch method', function () {
    // @ts-ignore access to the class private property
    reporter.launchId = 'tempLaunchId';
    const launchObj = { attributes: [{ key: 'test' }] };

    reporter.finishLaunch(launchObj);

    // @ts-ignore access to the class private property
    expect(reporter.client.finishLaunch).toHaveBeenCalledWith('tempLaunchId', launchObj);
  });
});
