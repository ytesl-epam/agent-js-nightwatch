import RPClient from 'reportportal-client';
// @ts-ignore
import { EVENTS as CLIENT_EVENTS } from 'reportportal-client/lib/events';
import { getLastItem } from '../utils';
import { EVENTS, LOG_LEVELS, STATUSES } from '../constants';
import { getStartLaunchObj, setDefaultFileType, subscribeToEvent } from './utils';
import {
  Attribute,
  FinishTestItemRQ,
  LogRQ,
  ReportPortalConfig,
  StartLaunchRQ,
  StartTestItemRQ,
} from '../models';

interface TestItem {
  id: string;
  name: string;
  parentId?: string;
  attributes?: Array<Attribute>;
  description?: string;
}

export default class Reporter {
  private client: RPClient;
  private launchId: string;
  private testItems: Array<TestItem>; // TODO: move it to the store in the near future

  constructor(config: ReportPortalConfig) {
    this.registerEventListeners();

    this.client = new RPClient(config);
    this.testItems = [];
  }

  private registerEventListeners(): void {
    subscribeToEvent(EVENTS.START_TEST_ITEM, this.startTestItem.bind(this));
    subscribeToEvent(EVENTS.FINISH_TEST_ITEM, this.finishTestItem.bind(this));

    subscribeToEvent(CLIENT_EVENTS.ADD_LOG, this.sendLogToItem.bind(this));
    subscribeToEvent(CLIENT_EVENTS.ADD_LAUNCH_LOG, this.sendLogToLaunch.bind(this));
    subscribeToEvent(CLIENT_EVENTS.ADD_ATTRIBUTES, this.addItemAttributes.bind(this));
    subscribeToEvent(CLIENT_EVENTS.SET_DESCRIPTION, this.setItemDescription.bind(this));
  };

  private getLastItem(): TestItem {
    return getLastItem(this.testItems);
  };

  private getTestItemByName(itemName: string, eject: boolean): TestItem {
    if (itemName) {
      const itemIndex = this.testItems.findIndex((item) => item.name === itemName);

      if (itemIndex !== -1) {
        const item = this.testItems[itemIndex];

        if (eject) {
          this.testItems.splice(itemIndex, 1);
        }

        return item;
      }
    }

    return eject ? this.testItems.pop() : this.getLastItem();
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
    const parentItem = this.getTestItemByName(startTestItemObj.parentName, false);
    const parentId = parentItem ? parentItem.id : undefined;
    const itemObj = this.client.startTestItem(startTestItemObj, this.launchId, parentId);

    const testItem: TestItem = {
      id: itemObj.tempId,
      name: startTestItemObj.name,
      attributes: [],
      description: startTestItemObj.description || '',
    };

    this.testItems.push(testItem);
  };

  private finishTestItem(testResult: any): void {
    const { id, ...data } = this.getTestItemByName(testResult.name, true);
    const finishTestItemObj = this.getItemDataObj(testResult, id);
    const finishItemObj = { ...data, ...finishTestItemObj };

    this.client.finishTestItem(id, finishItemObj);
  };

  private sendLogToItem(data: LogRQ): void {
    const currentItem = this.getLastItem();
    const { file, ...log } = data;
    const fileToSend = setDefaultFileType(file);

    this.client.sendLog(currentItem.id, log, fileToSend);
  };

  private sendLogToLaunch(data: LogRQ): void {
    const { file, ...log } = data;
    const fileToSend = setDefaultFileType(file);

    this.client.sendLog(this.launchId, log, fileToSend);
  }

  private addItemAttributes(data: { attributes: Array<Attribute> }): void {
    const currentItem = this.getLastItem();

    currentItem.attributes = currentItem.attributes.concat(data.attributes);
  };

  private setItemDescription(data: { text: string }): void {
    const currentItem = this.getLastItem();

    currentItem.description = data.text;
  };
}
