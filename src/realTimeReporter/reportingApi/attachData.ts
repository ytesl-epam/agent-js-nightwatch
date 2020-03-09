// @ts-ignore
import PublicReportingAPI from 'reportportal-client/lib/publicReportingAPI';
import { LOG_LEVELS } from '../../constants';
import { AttachmentRQ, Attribute, LogRQ } from '../../models';

type LogMessage = Pick<LogRQ, 'message'>;

export interface AttachDataInterface {
    addAttributes(attributes: Array<Attribute>): void;
    addDescription(text: string): void;
    addAttachment(level: Pick<LogRQ, 'level'>, file: Pick<AttachmentRQ, 'file'>, message: LogMessage): void;

    addLog(level: Pick<LogRQ, 'level'>, message: LogMessage): void;
    logInfo(message: LogMessage): void;
    logDebug(message: LogMessage): void;
    logError(message: LogMessage): void;
    logTrace(message: LogMessage): void;
    logFatal(message: LogMessage): void;
}

export const attachData: AttachDataInterface = {
    addAttributes: PublicReportingAPI.addAttributes,
    addDescription: PublicReportingAPI.addDescription,
    addAttachment: PublicReportingAPI.addAttachment,

    addLog: PublicReportingAPI.addLog,
    logInfo: (message) => {
        PublicReportingAPI.addLog(LOG_LEVELS.INFO, message);
    },
    logDebug: (message) => {
        PublicReportingAPI.addLog(LOG_LEVELS.DEBUG, message);
    },
    logError: (message) => {
        PublicReportingAPI.addLog(LOG_LEVELS.ERROR, message);
    },
    logTrace: (message) => {
        PublicReportingAPI.addLog(LOG_LEVELS.TRACE, message);
    },
    logFatal: (message) => {
        PublicReportingAPI.addLog(LOG_LEVELS.FATAL, message);
    },
};
