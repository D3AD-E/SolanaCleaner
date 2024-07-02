import dotenv from 'dotenv';
import logger from './src/utils/logger';
import clean from './src/cleaner';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

dotenv.config();
logger.info('Started');
const argv = yargs(hideBin(process.argv)).argv as any;
const shouldForce = argv['force'] as boolean;
clean(shouldForce ?? false);
