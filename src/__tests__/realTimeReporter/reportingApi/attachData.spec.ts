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
import PublicReportingAPI from 'reportportal-client/lib/publicReportingAPI';
import { attachData } from "../../../realTimeReporter/reportingApi/attachData";
import { FILE_TYPES, LOG_LEVELS } from "../../../constants";

describe('attachData', function () {
  test('addAttributes: should call addAttributes method from the client PublicReportingAPI', function () {
    const spyClientAddAttributes = jest.spyOn(PublicReportingAPI, 'addAttributes')
      .mockImplementation(() => {});

    attachData.addAttributes([], 'parentItem');

    expect(spyClientAddAttributes).toHaveBeenCalledWith([], 'parentItem');
  });

  test('setDescription: should call setDescription method from the client PublicReportingAPI', function () {
    const spyClientSetDescription = jest.spyOn(PublicReportingAPI, 'setDescription')
      .mockImplementation(() => {});

    attachData.setDescription('description', 'parentItem');

    expect(spyClientSetDescription).toHaveBeenCalledWith('description', 'parentItem');
  });

  describe('item log functions', function () {
    let spyClientAddLog: jest.SpyInstance;

    beforeEach(() => {
      spyClientAddLog = jest.spyOn(PublicReportingAPI, 'addLog').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('log', function () {
      test('should call addLog method from the client PublicReportingAPI', function () {
        const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

        attachData.log(LOG_LEVELS.INFO, 'log', file, 'parentName');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.INFO, message: 'log', file }, 'parentName');
      });

      test('should set file to null if it not exists', function () {
        attachData.log(LOG_LEVELS.INFO, 'log');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.INFO, message: 'log', file: null }, undefined);
      });
    });

    describe('logInfo', function () {
      test('should call addLog method from the client PublicReportingAPI with INFO log level', function () {
        const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

        attachData.logInfo('log', file, 'parentName');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.INFO, message: 'log', file }, 'parentName');
      });

      test('should set file to null if it not exists', function () {
        attachData.logInfo('log');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.INFO, message: 'log', file: null }, undefined);
      });
    });

    describe('logDebug', function () {
      test('should call addLog method from the client PublicReportingAPI with DEBUG log level', function () {
        const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

        attachData.logDebug('log', file, 'parentName');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.DEBUG, message: 'log', file }, 'parentName');
      });

      test('should set file to null if it not exists', function () {
        attachData.logDebug('log');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.DEBUG, message: 'log', file: null }, undefined);
      });
    });

    describe('logWarn', function () {
      test('should call addLog method from the client PublicReportingAPI with WARN log level', function () {
        const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

        attachData.logWarn('log', file, 'parentName');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.WARN, message: 'log', file }, 'parentName');
      });

      test('should set file to null if it not exists', function () {
        attachData.logWarn('log');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.WARN, message: 'log', file: null }, undefined);
      });
    });

    describe('logError', function () {
      test('should call addLog method from the client PublicReportingAPI with ERROR log level', function () {
        const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

        attachData.logError('log', file, 'parentName');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.ERROR, message: 'log', file }, 'parentName');
      });

      test('should set file to null if it not exists', function () {
        attachData.logError('log');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.ERROR, message: 'log', file: null }, undefined);
      });
    });

    describe('logTrace', function () {
      test('should call addLog method from the client PublicReportingAPI with TRACE log level', function () {
        const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

        attachData.logTrace('log', file, 'parentName');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.TRACE, message: 'log', file }, 'parentName');
      });

      test('should set file to null if it not exists', function () {
        attachData.logTrace('log');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.TRACE, message: 'log', file: null }, undefined);
      });
    });

    describe('logFatal', function () {
      test('should call addLog method from the client PublicReportingAPI with FATAL log level', function () {
        const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

        attachData.logFatal('log', file, 'parentName');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.FATAL, message: 'log', file }, 'parentName');
      });

      test('should set file to null if it not exists', function () {
        attachData.logFatal('log');

        expect(spyClientAddLog).toHaveBeenCalledWith({ level: LOG_LEVELS.FATAL, message: 'log', file: null }, undefined);
      });
    });
  });


  describe('launch log functions', function () {
    let spyClientAddLaunchLog: jest.SpyInstance;

    beforeEach(() => {
      spyClientAddLaunchLog = jest.spyOn(PublicReportingAPI, 'addLaunchLog').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('launchLog: should call addLaunchLog method from the client PublicReportingAPI', function () {
      const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

      attachData.launchLog(LOG_LEVELS.INFO, 'log', file);

      expect(spyClientAddLaunchLog).toHaveBeenCalledWith({ level: LOG_LEVELS.INFO, message: 'log', file });
    });

    test('launchLogInfo: should call addLaunchLog method from the client PublicReportingAPI with INFO log level', function () {
      const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

      attachData.launchLogInfo('log', file);

      expect(spyClientAddLaunchLog).toHaveBeenCalledWith({ level: LOG_LEVELS.INFO, message: 'log', file });
    });

    test('launchLogDebug: should call addLaunchLog method from the client PublicReportingAPI with DEBUG log level', function () {
      const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

      attachData.launchLogDebug('log', file);

      expect(spyClientAddLaunchLog).toHaveBeenCalledWith({ level: LOG_LEVELS.DEBUG, message: 'log', file });
    });

    test('launchLogWarn: should call addLaunchLog method from the client PublicReportingAPI with WARN log level', function () {
      const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

      attachData.launchLogWarn('log', file);

      expect(spyClientAddLaunchLog).toHaveBeenCalledWith({ level: LOG_LEVELS.WARN, message: 'log', file });
    });

    test('launchLogError: should call addLaunchLog method from the client PublicReportingAPI with ERROR log level', function () {
      const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

      attachData.launchLogError('log', file);

      expect(spyClientAddLaunchLog).toHaveBeenCalledWith({ level: LOG_LEVELS.ERROR, message: 'log', file });
    });

    test('launchLogTrace: should call addLaunchLog method from the client PublicReportingAPI with TRACE log level', function () {
      const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

      attachData.launchLogTrace('log', file);

      expect(spyClientAddLaunchLog).toHaveBeenCalledWith({ level: LOG_LEVELS.TRACE, message: 'log', file });
    });

    test('launchLogFatal: should call addLaunchLog method from the client PublicReportingAPI with FATAL log level', function () {
      const file = { name: 'fileName', type: FILE_TYPES.TEXT, content: 'empty' };

      attachData.launchLogFatal('log', file);

      expect(spyClientAddLaunchLog).toHaveBeenCalledWith({ level: LOG_LEVELS.FATAL, message: 'log', file });
    });
  });
});
