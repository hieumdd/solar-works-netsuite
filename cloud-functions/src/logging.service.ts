import { createLogger, format, transports } from 'winston';
const { combine, printf } = format;

export const logger = createLogger({
    format: combine(
        printf(({ level, message }) => {
            return JSON.stringify({ severity: level, ...message });
        }),
    ),
    transports: [new transports.Console()],
});
