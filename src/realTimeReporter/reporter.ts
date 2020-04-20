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

import RPClient from 'reportportal-client';
// @ts-ignore
import { EVENTS as CLIENT_EVENTS } from 'reportportal-client/lib/events';
import { getAgentInfo } from '../utils';
import { EVENTS, LOG_LEVELS, STATUSES } from '../constants';
import {
  Attribute,
  FinishTestItemRQ,
  LogRQ,
  ReportPortalConfig,
  StartLaunchRQ,
  StartTestItemRQ,
  StorageTestItem,
} from '../models';
import { getStartLaunchObj, setDefaultFileType, subscribeToEvent } from './utils';
import { Storage } from './storage';

export default class Reporter {
  private client: RPClient;
  private launchId: string;
  private storage: Storage;

  constructor(config: ReportPortalConfig) {
    this.registerEventListeners();

    const agentInfo = getAgentInfo();

    this.client = new RPClient(config, agentInfo);
    this.storage = new Storage();
  }

  private registerEventListeners(): void {
    subscribeToEvent(EVENTS.START_TEST_ITEM, this.startTestItem.bind(this));
    subscribeToEvent(EVENTS.FINISH_TEST_ITEM, this.finishTestItem.bind(this));

    subscribeToEvent(CLIENT_EVENTS.ADD_LOG, this.sendLogToItem.bind(this));
    subscribeToEvent(CLIENT_EVENTS.ADD_LAUNCH_LOG, this.sendLogToLaunch.bind(this));
    subscribeToEvent(CLIENT_EVENTS.ADD_ATTRIBUTES, this.addItemAttributes.bind(this));
    subscribeToEvent(CLIENT_EVENTS.SET_DESCRIPTION, this.setItemDescription.bind(this));
  };

  private getItemDataObj(testResult: any, id: string): FinishTestItemRQ {
    if (!testResult || !testResult.results) {
      return {
        status: STATUSES.PASSED,
      };
    }

    const currentTestItemResults = testResult.results.testcases[testResult.name];
    let status;

    if (currentTestItemResults.skipped !== 0) {
      status = STATUSES.SKIPPED;
    } else if (currentTestItemResults.failed !== 0) {
      status = STATUSES.FAILED;
      const assertionsResult = currentTestItemResults.assertions[0];

      const itemLog: LogRQ = {
        level: LOG_LEVELS.ERROR,
        message: `${assertionsResult.fullMsg}
${assertionsResult.stackTrace}`,
      };

      this.client.sendLog(id, itemLog);
    } else {
      status = STATUSES.PASSED;
    }

    return {
      status,
    };
  };

  public startLaunch(launchObj: StartLaunchRQ): void {
    const startLaunchObj: StartLaunchRQ = getStartLaunchObj(launchObj);

    this.launchId = this.client.startLaunch(startLaunchObj).tempId;
  };

  public finishLaunch(launchFinishObj = {}): void {
    this.client.finishLaunch(this.launchId, launchFinishObj);
  };

  private startTestItem(startTestItemObj: StartTestItemRQ): void {
    const parentItem = this.storage.getCurrentItem(startTestItemObj.parentName);
    const parentId = parentItem ? parentItem.id : undefined;
    const itemObj = this.client.startTestItem(startTestItemObj, this.launchId, parentId);

    const testItem: StorageTestItem = {
      id: itemObj.tempId,
      name: startTestItemObj.name,
      attributes: [],
      description: startTestItemObj.description || '',
    };

    this.storage.addTestItem(testItem);
  };

  private finishTestItem(testResult: any): void {
    const { id, ...data } = this.storage.getTestItemByName(testResult.name);
    const finishTestItemObj = this.getItemDataObj(testResult, id);
    const finishItemObj = { ...data, ...finishTestItemObj };

    this.storage.removeItemById(id);
    this.client.finishTestItem(id, finishItemObj);
  };

  private sendLogToItem(data: { log: LogRQ; suite?: string }): void {
    const { log: { file, ...log }, suite: suiteName } = data;
    const currentItem = this.storage.getCurrentItem(suiteName);
    const fileToSend = setDefaultFileType(file);

    this.client.sendLog(currentItem.id, log, fileToSend);
  };

  private sendLogToLaunch(data: LogRQ): void {
    const { file, ...log } = data;
    const fileToSend = setDefaultFileType(file);

    this.client.sendLog(this.launchId, log, fileToSend);
  }

  private addItemAttributes(data: { attributes: Array<Attribute>, suite?: string }): void {
    const currentItem = this.storage.getCurrentItem(data.suite);

    currentItem.attributes = currentItem.attributes.concat(data.attributes);
  };

  private setItemDescription(data: { text: string, suite?: string }): void {
    const currentItem = this.storage.getCurrentItem(data.suite);

    currentItem.description = data.text;
  };
}
